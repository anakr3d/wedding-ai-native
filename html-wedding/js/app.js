// Wedding Website JavaScript Application

class WeddingApp {
    constructor() {
        this.API_BASE_URL = '/html-wedding/api';
        
        // Gallery state
        this.galleryImages = [
            {
                url: "https://images.unsplash.com/photo-1541385496969-a3edfa5a94ed?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxyb21hbnRpYyUyMGNvdXBsZXxlbnwwfHx8fDE3NTUxNjI1MDV8MA&ixlib=rb-4.1.0&q=85",
                title: "Our First Kiss",
                caption: "The moment we knew we were meant to be"
            },
            {
                url: "https://images.unsplash.com/photo-1591969851586-adbbd4accf81?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwyfHxyb21hbnRpYyUyMGNvdXBsZXxlbnwwfHx8fDE3NTUxNjI1MDV8MA&ixlib=rb-4.1.0&q=85",
                title: "Sunset Moments",
                caption: "Watching sunsets together, dreaming of forever"
            },
            {
                url: "https://images.unsplash.com/photo-1514480657081-a987d9a45e90?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHxyb21hbnRpYyUyMGNvdXBsZXxlbnwwfHx8fDE3NTUxNjI1MDV8MA&ixlib=rb-4.1.0&q=85",
                title: "Morning Love",
                caption: "Every morning with you feels like a blessing"
            },
            {
                url: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nfGVufDB8fHx8MTc1NTE2MjUxMHww&ixlib=rb-4.1.0&q=85",
                title: "Our Engagement",
                caption: "She said yes! The beginning of our forever"
            },
            {
                url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHx3ZWRkaW5nfGVufDB8fHx8MTc1NTE2MjUxMHww&ixlib=rb-4.1.0&q=85",
                title: "Hand in Hand",
                caption: "Together we can conquer anything"
            },
            {
                url: "https://images.unsplash.com/photo-1519741497674-611481863552?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwzfHx3ZWRkaW5nfGVufDB8fHx8MTc1NTE2MjUxMHww&ixlib=rb-4.1.0&q=85",
                title: "Wedding Prep",
                caption: "Getting ready for the most important day of our lives"
            }
        ];
        
        this.currentGalleryImage = 0;
        this.isGalleryPlaying = true;
        this.galleryInterval = null;
        
        // Music state
        this.playlist = [
            { title: "Perfect", artist: "Ed Sheeran", src: "https://www.soundjay.com/buttons/sounds/button-09.wav" },
            { title: "All of Me", artist: "John Legend", src: "https://www.soundjay.com/buttons/sounds/button-10.wav" },
            { title: "Thinking Out Loud", artist: "Ed Sheeran", src: "https://www.soundjay.com/buttons/sounds/button-3.wav" }
        ];
        
        this.currentTrack = 0;
        this.isPlaying = false;
        
        // Gift state
        this.selectedPackage = '';
        this.giftPackages = {};
        
        this.init();
    }

    init() {
        this.setupLucideIcons();
        this.setupEventListeners();
        this.initGallery();
        this.initMusicPlayer();
        this.loadComments();
        this.loadGiftPackages();
        this.checkPaymentReturn();
    }

    setupLucideIcons() {
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setupEventListeners() {
        // Gallery events
        document.getElementById('prevGallery').addEventListener('click', () => this.prevImage());
        document.getElementById('nextGallery').addEventListener('click', () => this.nextImage());
        document.getElementById('galleryPlayPause').addEventListener('click', () => this.toggleGalleryPlayback());

        // Music events
        document.getElementById('playPause').addEventListener('click', () => this.toggleMusic());
        document.getElementById('prevTrack').addEventListener('click', () => this.prevTrack());
        document.getElementById('nextTrack').addEventListener('click', () => this.nextTrack());
        document.getElementById('volumeSlider').addEventListener('input', (e) => this.setVolume(e.target.value));

        // Comment form
        document.getElementById('commentForm').addEventListener('submit', (e) => this.submitComment(e));

        // Gift modal
        document.getElementById('openGiftDialog').addEventListener('click', () => this.openGiftModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeGiftModal());
        document.getElementById('giftForm').addEventListener('submit', (e) => this.submitGift(e));

        // Gift package selection
        document.querySelectorAll('.gift-package').forEach(pkg => {
            pkg.addEventListener('click', (e) => this.selectPackage(e.target.closest('.gift-package')));
        });

        // Alert close
        document.getElementById('closeAlert').addEventListener('click', () => this.hideAlert());

        // Modal backdrop close
        document.getElementById('giftModal').addEventListener('click', (e) => {
            if (e.target.id === 'giftModal') {
                this.closeGiftModal();
            }
        });
    }

    // Gallery Methods
    initGallery() {
        this.updateGalleryImage();
        this.createGalleryDots();
        this.startGallerySlideshow();
    }

    updateGalleryImage() {
        const image = this.galleryImages[this.currentGalleryImage];
        document.getElementById('galleryImage').src = image.url;
        document.getElementById('galleryImage').alt = image.title;
        document.getElementById('galleryTitle').textContent = image.title;
        document.getElementById('galleryCaption').textContent = image.caption;
        
        // Update dots
        document.querySelectorAll('.gallery-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentGalleryImage);
        });
    }

    createGalleryDots() {
        const dotsContainer = document.getElementById('galleryDots');
        dotsContainer.innerHTML = '';
        
        this.galleryImages.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'gallery-dot';
            if (index === this.currentGalleryImage) {
                dot.classList.add('active');
            }
            dot.addEventListener('click', () => this.goToImage(index));
            dotsContainer.appendChild(dot);
        });
    }

    goToImage(index) {
        this.currentGalleryImage = index;
        this.updateGalleryImage();
    }

    nextImage() {
        this.currentGalleryImage = (this.currentGalleryImage + 1) % this.galleryImages.length;
        this.updateGalleryImage();
    }

    prevImage() {
        this.currentGalleryImage = (this.currentGalleryImage - 1 + this.galleryImages.length) % this.galleryImages.length;
        this.updateGalleryImage();
    }

    startGallerySlideshow() {
        if (this.galleryInterval) {
            clearInterval(this.galleryInterval);
        }
        
        if (this.isGalleryPlaying) {
            this.galleryInterval = setInterval(() => this.nextImage(), 4000);
        }
    }

    toggleGalleryPlayback() {
        this.isGalleryPlaying = !this.isGalleryPlaying;
        const button = document.getElementById('galleryPlayPause');
        const icon = button.querySelector('i');
        const text = button.querySelector('span');
        
        if (this.isGalleryPlaying) {
            icon.setAttribute('data-lucide', 'pause');
            text.textContent = 'Pause';
        } else {
            icon.setAttribute('data-lucide', 'play');
            text.textContent = 'Play';
        }
        
        this.setupLucideIcons();
        this.startGallerySlideshow();
    }

    // Music Player Methods
    initMusicPlayer() {
        this.updateTrackInfo();
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.addEventListener('ended', () => this.nextTrack());
        audioPlayer.volume = 0.5;
    }

    updateTrackInfo() {
        const track = this.playlist[this.currentTrack];
        document.getElementById('currentTrackTitle').textContent = track.title;
        document.getElementById('currentTrackArtist').textContent = track.artist;
        
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.src = track.src;
    }

    toggleMusic() {
        const audioPlayer = document.getElementById('audioPlayer');
        const playPauseBtn = document.getElementById('playPause');
        const icon = playPauseBtn.querySelector('i');
        
        if (this.isPlaying) {
            audioPlayer.pause();
            icon.setAttribute('data-lucide', 'play');
            this.isPlaying = false;
        } else {
            audioPlayer.play().catch(e => console.log('Audio play failed:', e));
            icon.setAttribute('data-lucide', 'pause');
            this.isPlaying = true;
        }
        
        this.setupLucideIcons();
    }

    nextTrack() {
        this.currentTrack = (this.currentTrack + 1) % this.playlist.length;
        this.updateTrackInfo();
        
        if (this.isPlaying) {
            setTimeout(() => {
                document.getElementById('audioPlayer').play().catch(e => console.log('Audio play failed:', e));
            }, 100);
        }
    }

    prevTrack() {
        this.currentTrack = (this.currentTrack - 1 + this.playlist.length) % this.playlist.length;
        this.updateTrackInfo();
        
        if (this.isPlaying) {
            setTimeout(() => {
                document.getElementById('audioPlayer').play().catch(e => console.log('Audio play failed:', e));
            }, 100);
        }
    }

    setVolume(value) {
        document.getElementById('audioPlayer').volume = value;
        
        // Update slider background
        const slider = document.getElementById('volumeSlider');
        const percentage = value * 100;
        slider.style.background = `linear-gradient(to right, #ec4899 0%, #ec4899 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
    }

    // Comments Methods
    async loadComments() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/comments.php`);
            const comments = await response.json();
            this.displayComments(comments);
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    displayComments(comments) {
        const commentsList = document.getElementById('commentsList');
        
        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="empty-comments">
                    <p>No messages yet. Be the first to leave a message for the happy couple!</p>
                </div>
            `;
            return;
        }

        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-card">
                <div class="comment-header">
                    <div class="comment-name">${this.escapeHtml(comment.guest_name)}</div>
                    <div class="comment-date">${new Date(comment.timestamp).toLocaleDateString()}</div>
                </div>
                <div class="comment-message">${this.escapeHtml(comment.message)}</div>
            </div>
        `).join('');
    }

    async submitComment(e) {
        e.preventDefault();
        
        const guestName = document.getElementById('guestName').value.trim();
        const message = document.getElementById('guestMessage').value.trim();
        
        if (!guestName || !message) return;
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const submitText = document.getElementById('submitText');
        
        submitBtn.disabled = true;
        submitText.textContent = 'Sending...';
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/comments.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    guest_name: guestName,
                    message: message
                })
            });
            
            if (response.ok) {
                document.getElementById('commentForm').reset();
                await this.loadComments();
            } else {
                throw new Error('Failed to submit comment');
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Error submitting comment. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitText.textContent = 'Send Message';
        }
    }

    // Gift Methods
    async loadGiftPackages() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/gifts.php`);
            this.giftPackages = await response.json();
        } catch (error) {
            console.error('Error loading gift packages:', error);
        }
    }

    openGiftModal() {
        document.getElementById('giftModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeGiftModal() {
        document.getElementById('giftModal').classList.add('hidden');
        document.body.style.overflow = '';
        
        // Reset form
        document.getElementById('giftForm').reset();
        document.querySelectorAll('.gift-package').forEach(pkg => pkg.classList.remove('selected'));
        document.getElementById('customAmountGroup').classList.add('hidden');
        document.getElementById('continuePayment').disabled = true;
        this.selectedPackage = '';
    }

    selectPackage(packageElement) {
        // Remove previous selection
        document.querySelectorAll('.gift-package').forEach(pkg => pkg.classList.remove('selected'));
        
        // Select current package
        packageElement.classList.add('selected');
        this.selectedPackage = packageElement.dataset.package;
        
        // Show/hide custom amount field
        const customAmountGroup = document.getElementById('customAmountGroup');
        if (this.selectedPackage === 'custom') {
            customAmountGroup.classList.remove('hidden');
        } else {
            customAmountGroup.classList.add('hidden');
        }
        
        this.updatePaymentButton();
    }

    updatePaymentButton() {
        const donorName = document.getElementById('donorName').value.trim();
        const customAmount = document.getElementById('customAmount').value;
        const button = document.getElementById('continuePayment');
        
        let canProceed = donorName && this.selectedPackage;
        
        if (this.selectedPackage === 'custom') {
            canProceed = canProceed && customAmount && parseFloat(customAmount) >= 1;
        }
        
        button.disabled = !canProceed;
    }

    async submitGift(e) {
        e.preventDefault();
        
        const donorName = document.getElementById('donorName').value.trim();
        const customAmount = document.getElementById('customAmount').value;
        
        if (!this.selectedPackage || !donorName) return;
        
        if (this.selectedPackage === 'custom' && (!customAmount || parseFloat(customAmount) < 1)) {
            alert('Please enter a valid custom amount (minimum $1.00)');
            return;
        }
        
        const button = document.getElementById('continuePayment');
        button.disabled = true;
        button.textContent = 'Processing...';
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/payments.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    package_id: this.selectedPackage,
                    guest_name: donorName,
                    custom_amount: this.selectedPackage === 'custom' ? parseFloat(customAmount) : null,
                    origin_url: window.location.origin + window.location.pathname
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.url) {
                // Redirect to Stripe Checkout
                window.location.href = result.url;
            } else {
                throw new Error(result.error || 'Failed to create payment session');
            }
        } catch (error) {
            console.error('Error creating payment:', error);
            alert('Error processing payment. Please try again.');
        } finally {
            button.disabled = false;
            button.textContent = 'Continue to Payment';
        }
    }

    // Payment Status Methods
    checkPaymentReturn() {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const success = urlParams.get('success');
        const cancelled = urlParams.get('cancelled');

        if (sessionId && success) {
            this.pollPaymentStatus(sessionId);
        } else if (cancelled) {
            this.showAlert('Payment was cancelled.', 'error');
        }
    }

    async pollPaymentStatus(sessionId, attempts = 0) {
        const maxAttempts = 5;
        const pollInterval = 2000;

        if (attempts >= maxAttempts) {
            this.showAlert('Payment status check timed out.', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/payment-status.php?session_id=${sessionId}`);
            const data = await response.json();

            if (data.payment_status === 'paid') {
                this.showAlert(`Thank you ${data.guest_name}! Your gift of $${(data.amount_total / 100).toFixed(2)} was received successfully.`, 'success');
                // Clear URL parameters
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
            } else if (data.status === 'expired') {
                this.showAlert('Payment session expired. Please try again.', 'error');
                return;
            }

            // Continue polling
            setTimeout(() => this.pollPaymentStatus(sessionId, attempts + 1), pollInterval);
        } catch (error) {
            console.error('Error checking payment status:', error);
            this.showAlert('Error checking payment status.', 'error');
        }
    }

    showAlert(message, type = 'success') {
        const alert = document.getElementById('paymentAlert');
        const alertMessage = document.getElementById('alertMessage');
        const alertIcon = document.getElementById('alertIcon');
        
        alertMessage.textContent = message;
        
        if (type === 'success') {
            alert.classList.remove('error');
            alertIcon.innerHTML = '✓';
        } else {
            alert.classList.add('error');
            alertIcon.innerHTML = '✗';
        }
        
        alert.classList.remove('hidden');
    }

    hideAlert() {
        document.getElementById('paymentAlert').classList.add('hidden');
    }

    // Utility Methods
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add input event listeners for form validation
    document.addEventListener('input', (e) => {
        if (e.target.id === 'donorName' || e.target.id === 'customAmount') {
            if (window.weddingApp) {
                window.weddingApp.updatePaymentButton();
            }
        }
    });
    
    // Initialize the main application
    window.weddingApp = new WeddingApp();
});