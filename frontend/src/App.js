import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Heart, Music, MessageCircle, Gift, Play, Pause, SkipForward, SkipBack, Volume2, QrCode, Check, X, ChevronLeft, ChevronRight, Camera, Calendar, MapPin, Users } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Badge } from './components/ui/badge';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({ guest_name: '', message: '' });
  const [giftPackages, setGiftPackages] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [guestName, setGuestName] = useState('');
  
  // Music player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(null);

  // Wedding playlist
  const playlist = [
    { title: "Perfect", artist: "Ed Sheeran", src: "https://www.soundjay.com/buttons/sounds/button-09.wav" },
    { title: "All of Me", artist: "John Legend", src: "https://www.soundjay.com/buttons/sounds/button-10.wav" },
    { title: "Thinking Out Loud", artist: "Ed Sheeran", src: "https://www.soundjay.com/buttons/sounds/button-3.wav" },
  ];

  useEffect(() => {
    fetchComments();
    fetchGiftPackages();
    checkPaymentReturn();
  }, []);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchGiftPackages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/gift-packages`);
      setGiftPackages(response.data);
    } catch (error) {
      console.error('Error fetching gift packages:', error);
    }
  };

  const checkPaymentReturn = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');
    const cancelled = urlParams.get('cancelled');

    if (sessionId && success) {
      pollPaymentStatus(sessionId);
    } else if (cancelled) {
      setPaymentStatus({ type: 'error', message: 'Payment was cancelled.' });
    }
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setPaymentStatus({ type: 'error', message: 'Payment status check timed out.' });
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/payments/status/${sessionId}`);
      const data = response.data;

      if (data.payment_status === 'paid') {
        setPaymentStatus({ 
          type: 'success', 
          message: `Thank you ${data.guest_name}! Your gift of $${(data.amount_total / 100).toFixed(2)} was received successfully.` 
        });
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      } else if (data.status === 'expired') {
        setPaymentStatus({ type: 'error', message: 'Payment session expired. Please try again.' });
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus({ type: 'error', message: 'Error checking payment status.' });
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.guest_name.trim() || !newComment.message.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/comments`, newComment);
      setComments([response.data, ...comments]);
      setNewComment({ guest_name: '', message: '' });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
    setIsLoading(false);
  };

  const handleGiftPayment = async () => {
    if (!selectedPackage || !guestName.trim()) return;
    if (selectedPackage === 'custom' && (!customAmount || parseFloat(customAmount) < 1)) {
      alert('Please enter a valid custom amount (minimum $1.00)');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/payments/checkout`, {
        package_id: selectedPackage,
        guest_name: guestName,
        custom_amount: selectedPackage === 'custom' ? parseFloat(customAmount) : null,
        origin_url: window.location.origin
      });

      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Error processing payment. Please try again.');
    }
    setIsLoading(false);
  };

  // Music player functions
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % playlist.length);
  };

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-white">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={playlist[currentTrack]?.src}
        onEnded={nextTrack}
        onLoadedData={() => {
          if (audioRef.current) audioRef.current.volume = volume;
        }}
      />

      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-pink-100 to-rose-100 py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1680882533244-f520ba6264fa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHxyb21hbnRpYyUyMHdlZGRpbmclMjBmbG93ZXJzJTIwcGlua3xlbnwwfHx8fDE3NTUxNjE3MzV8MA&ixlib=rb-4.1.0&q=85)'
          }}
        ></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <div className="flex justify-center mb-6">
            <Heart className="w-16 h-16 text-pink-500 animate-pulse" />
          </div>
          <h1 className="text-6xl font-serif text-gray-800 mb-4">Sarah & Michael</h1>
          <p className="text-2xl text-gray-600 mb-6">June 15th, 2025</p>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Join us as we celebrate our love story and begin our journey as one. 
            Your presence is the greatest gift, but your love and support mean the world to us.
          </p>
        </div>
      </header>

      {/* Payment Status Alert */}
      {paymentStatus && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          paymentStatus.type === 'success' ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
        }`}>
          <div className="flex items-center">
            {paymentStatus.type === 'success' ? (
              <Check className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <X className="w-5 h-5 text-red-600 mr-2" />
            )}
            <p className={paymentStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {paymentStatus.message}
            </p>
          </div>
          <button
            onClick={() => setPaymentStatus(null)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        
        {/* Music Player */}
        <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-100">
          <div className="flex items-center justify-center mb-6">
            <Music className="w-8 h-8 text-pink-500 mr-3" />
            <h2 className="text-3xl font-serif text-gray-800">Our Wedding Playlist</h2>
          </div>
          
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {playlist[currentTrack]?.title}
              </h3>
              <p className="text-gray-600">{playlist[currentTrack]?.artist}</p>
            </div>
            
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevTrack}
                className="rounded-full w-12 h-12 border-pink-200 hover:bg-pink-50"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button 
                onClick={togglePlay}
                className="rounded-full w-16 h-16 bg-pink-500 hover:bg-pink-600 text-white shadow-lg"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextTrack}
                className="rounded-full w-12 h-12 border-pink-200 hover:bg-pink-50"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-3">
              <Volume2 className="w-4 h-4 text-gray-600" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 accent-pink-500"
              />
            </div>
          </div>
        </section>

        {/* Gift Section */}
        <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-100">
          <div className="flex items-center justify-center mb-8">
            <Gift className="w-8 h-8 text-pink-500 mr-3" />
            <h2 className="text-3xl font-serif text-gray-800">Wedding Gifts</h2>
          </div>
          
          <div className="text-center mb-8">
            <p className="text-lg text-gray-700 mb-6">
              Your presence at our wedding is the greatest gift. However, if you wish to honor us with a gift, 
              we would be grateful for your contribution to our future together.
            </p>
            
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogTrigger asChild>
                <Button className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full text-lg shadow-lg">
                  <QrCode className="w-5 h-5 mr-2" />
                  Send Wedding Gift
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center text-gray-800">Send a Wedding Gift</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <Input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Enter your name"
                      className="border-pink-200 focus:border-pink-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Choose Gift Amount</label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {Object.entries(giftPackages).map(([key, pkg]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedPackage(key)}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            selectedPackage === key
                              ? 'border-pink-500 bg-pink-50 text-pink-700'
                              : 'border-gray-200 hover:border-pink-300'
                          }`}
                        >
                          <div className="font-semibold">{pkg.name}</div>
                          {key !== 'custom' && (
                            <div className="text-sm text-gray-600">${pkg.amount}</div>
                          )}
                        </button>
                      ))}
                    </div>
                    
                    {selectedPackage === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Custom Amount ($)</label>
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="border-pink-200 focus:border-pink-400"
                        />
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleGiftPayment}
                    disabled={isLoading || !selectedPackage || !guestName.trim()}
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-lg"
                  >
                    {isLoading ? 'Processing...' : 'Continue to Payment'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Comments Section */}
        <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-100">
          <div className="flex items-center justify-center mb-8">
            <MessageCircle className="w-8 h-8 text-pink-500 mr-3" />
            <h2 className="text-3xl font-serif text-gray-800">Guest Messages</h2>
          </div>
          
          {/* Add Comment Form */}
          <form onSubmit={handleCommentSubmit} className="mb-8 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <Input
                  value={newComment.guest_name}
                  onChange={(e) => setNewComment({...newComment, guest_name: e.target.value})}
                  placeholder="Enter your name"
                  className="border-pink-200 focus:border-pink-400"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
              <Textarea
                value={newComment.message}
                onChange={(e) => setNewComment({...newComment, message: e.target.value})}
                placeholder="Share your wishes for the happy couple..."
                rows={4}
                className="border-pink-200 focus:border-pink-400"
              />
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full"
            >
              {isLoading ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
          
          {/* Comments List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {comments.map((comment) => (
              <Card key={comment.id} className="border-pink-100 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-gray-800">{comment.guest_name}</CardTitle>
                    <Badge variant="outline" className="text-pink-600 border-pink-200">
                      {new Date(comment.timestamp).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{comment.message}</p>
                </CardContent>
              </Card>
            ))}
            
            {comments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No messages yet. Be the first to leave a message for the happy couple!</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-pink-100 to-rose-100 py-12 mt-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="flex justify-center mb-6">
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <h3 className="text-2xl font-serif text-gray-800 mb-4">Thank You</h3>
          <p className="text-gray-700 mb-6">
            We are so grateful for your love and support as we begin this new chapter together.
          </p>
          <p className="text-sm text-gray-600">
            © 2025 Sarah & Michael's Wedding • Made with ❤️
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;