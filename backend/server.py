from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
import os
import uuid
from datetime import datetime
import motor.motor_asyncio
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

app = FastAPI(title="Wedding Website API")

# Database setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.wedding_db
comments_collection = db.comments
payment_transactions_collection = db.payment_transactions

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Stripe setup
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Fixed gift packages for security
GIFT_PACKAGES = {
    "small": {"amount": 25.0, "name": "Small Gift", "description": "A lovely gesture"},
    "medium": {"amount": 50.0, "name": "Medium Gift", "description": "A generous gift"},
    "large": {"amount": 100.0, "name": "Large Gift", "description": "A wonderful contribution"},
    "custom": {"amount": 0.0, "name": "Custom Amount", "description": "Choose your own amount"}
}

# Pydantic models
class Comment(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    guest_name: str
    message: str
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)

class CommentResponse(BaseModel):
    id: str
    guest_name: str
    message: str
    timestamp: datetime

class PaymentRequest(BaseModel):
    package_id: str
    guest_name: str
    custom_amount: Optional[float] = None
    origin_url: str

class PaymentTransaction(BaseModel):
    id: str
    session_id: str
    package_id: str
    guest_name: str
    amount: float
    currency: str
    payment_status: str
    timestamp: datetime
    metadata: Dict[str, str]

# API Routes

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Wedding API is running"}

@app.get("/api/comments", response_model=List[CommentResponse])
async def get_comments():
    """Get all wedding comments"""
    cursor = comments_collection.find().sort("timestamp", -1).limit(50)
    comments = []
    async for comment in cursor:
        comment["id"] = comment.pop("_id", comment.get("id"))
        comments.append(CommentResponse(**comment))
    return comments

@app.post("/api/comments", response_model=CommentResponse)
async def add_comment(comment: Comment):
    """Add a new wedding comment"""
    comment_dict = comment.dict()
    comment_dict["_id"] = comment_dict.pop("id")
    result = await comments_collection.insert_one(comment_dict)
    comment_dict["id"] = comment_dict.pop("_id")
    return CommentResponse(**comment_dict)

@app.get("/api/gift-packages")
async def get_gift_packages():
    """Get available gift packages"""
    return GIFT_PACKAGES

@app.post("/api/payments/checkout")
async def create_checkout_session(payment_request: PaymentRequest, request: Request):
    """Create Stripe checkout session for wedding gifts"""
    try:
        # Validate package
        if payment_request.package_id not in GIFT_PACKAGES:
            raise HTTPException(status_code=400, detail="Invalid gift package")
        
        package = GIFT_PACKAGES[payment_request.package_id]
        
        # Determine amount
        if payment_request.package_id == "custom" and payment_request.custom_amount:
            if payment_request.custom_amount < 1.0:
                raise HTTPException(status_code=400, detail="Custom amount must be at least $1.00")
            amount = payment_request.custom_amount
        else:
            amount = package["amount"]
        
        # Initialize Stripe
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Build success and cancel URLs
        success_url = f"{payment_request.origin_url}?session_id={{CHECKOUT_SESSION_ID}}&success=true"
        cancel_url = f"{payment_request.origin_url}?cancelled=true"
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "package_id": payment_request.package_id,
                "guest_name": payment_request.guest_name,
                "source": "wedding_gift"
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store transaction record
        transaction = {
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "package_id": payment_request.package_id,
            "guest_name": payment_request.guest_name,
            "amount": amount,
            "currency": "usd",
            "payment_status": "pending",
            "timestamp": datetime.now(),
            "metadata": checkout_request.metadata
        }
        
        await payment_transactions_collection.insert_one(transaction)
        
        return {"url": session.url, "session_id": session.session_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    """Get payment status for a session"""
    try:
        # Get transaction from database
        transaction = await payment_transactions_collection.find_one({"session_id": session_id})
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Check with Stripe
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction if status changed
        if checkout_status.payment_status != transaction["payment_status"]:
            await payment_transactions_collection.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": checkout_status.payment_status}}
            )
        
        return {
            "session_id": session_id,
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount_total": checkout_status.amount_total,
            "currency": checkout_status.currency,
            "guest_name": transaction["guest_name"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        body = await request.body()
        stripe_signature = request.headers.get("Stripe-Signature")
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
        
        # Update transaction status
        if webhook_response.session_id:
            await payment_transactions_collection.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"payment_status": webhook_response.payment_status}}
            )
        
        return {"status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/transactions")
async def get_transactions():
    """Get all payment transactions (for admin view)"""
    cursor = payment_transactions_collection.find().sort("timestamp", -1)
    transactions = []
    async for transaction in cursor:
        transaction["id"] = transaction.pop("_id", transaction.get("id"))
        transactions.append(transaction)
    return transactions

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)