class CafeBae {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.currentLocation = '';
        this.currentPage = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.totalResults = 0;
        this.sessionId = this.generateSessionId();
        this.approvedCafes = new Set();
        this.filterActive = false;
        this.characterShown = false;
        this.init();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    }

    init() {
        this.bindEvents();
        this.setupInfiniteScroll();
        this.setupChat();
        this.setupMenuModal();
    }

    bindEvents() {
        const searchBtn = document.getElementById('searchBtn');
        const locationInput = document.getElementById('locationInput');

        searchBtn.addEventListener('click', () => this.handleSearch());
        locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // City tag clicks
        document.querySelectorAll('.city-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                document.getElementById('locationInput').value = e.target.textContent;
                this.handleSearch();
            });
        });

        // Intercept cafe card clicks
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.restaurant-card');
            if (card && !this.characterShown && this.totalResults > 0) {
                e.preventDefault();
                e.stopPropagation();
                this.showCharacter();
            } else if (card && this.characterShown) {
                // Open menu modal
                const cafeId = card.dataset.cafeId;
                this.openMenu(cafeId);
            }
        });
    }

    setupChat() {
        const character = document.getElementById('character');
        const closeChatBtn = document.getElementById('closeChatBtn');
        const chatBackdrop = document.getElementById('chatBackdrop');
        const sendChatBtn = document.getElementById('sendChatBtn');
        const chatInput = document.getElementById('chatInput');

        // Open chat
        character.addEventListener('click', () => this.openChat());

        // Close chat
        closeChatBtn.addEventListener('click', () => this.closeChat());
        chatBackdrop.addEventListener('click', () => this.closeChat());

        // Send message
        sendChatBtn.addEventListener('click', () => this.sendMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    setupInfiniteScroll() {
        window.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

            // Load more when scrolled near bottom
            if (scrollTop + clientHeight >= scrollHeight - 500) {
                if (!this.isLoading && this.hasMore && this.currentLocation) {
                    this.loadMore();
                }
            }
        });
    }

    async handleSearch(resetPage = true) {
        const location = document.getElementById('locationInput').value.trim();

        if (!location) {
            this.showError('Please enter a city name');
            return;
        }

        if (resetPage) {
            this.currentLocation = location;
            this.currentPage = 0;
            this.hasMore = true;
            this.totalResults = 0;
            this.approvedCafes.clear();
            this.filterActive = false;
            this.characterShown = false;
            this.clearResults();
            this.hideNoMoreResults();
            this.hideCharacter();
            // Reset chat
            await fetch(`${this.apiUrl}/reset-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: this.sessionId })
            });
        }

        this.showLoading(true);
        this.hideError();
        this.isLoading = true;

        try {
            const response = await fetch(`${this.apiUrl}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: location,
                    keyword: 'cafe',
                    page: this.currentPage,
                    session_id: this.sessionId
                })
            });

            const data = await response.json();

            if (data.success && data.restaurants) {
                if (data.restaurants.length === 0 && this.currentPage === 0) {
                    this.showError('No cafes found in this location. Try: Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Pune');
                } else {
                    this.totalResults += data.restaurants.length;
                    this.displayResults(data.restaurants, this.currentPage > 0);
                    this.hasMore = data.hasMore;
                    this.updateResultsHeader();

                    // Show character with intro message on first page
                    if (this.currentPage === 0 && data.intro_message) {
                        setTimeout(() => {
                            this.showCharacterWithIntro(data.intro_message);
                        }, 1000);
                    }

                    if (!this.hasMore && this.currentPage > 0) {
                        this.showNoMoreResults();
                    }
                }
            } else {
                this.showError(data.error || 'No cafes found');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Failed to search cafes. Make sure the backend is running.');
        } finally {
            this.showLoading(false);
            this.isLoading = false;
        }
    }

    showCharacter() {
        const container = document.getElementById('characterContainer');
        container.classList.remove('hidden');
        container.classList.add('animate-fade-in');
    }

    hideCharacter() {
        const container = document.getElementById('characterContainer');
        container.classList.add('hidden');
    }

    showCharacterWithIntro(message) {
        this.showCharacter();
        // Auto-open chat with intro message
        setTimeout(() => {
            this.openChat();
            this.addMessage(message, 'assistant');
        }, 500);
    }

    openChat() {
        document.getElementById('chatModal').classList.remove('hidden');
    }

    closeChat() {
        document.getElementById('chatModal').classList.add('hidden');
    }

    addMessage(text, role = 'user') {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`;

        const bubble = document.createElement('div');
        bubble.className = `max-w-[80%] px-6 py-4 rounded-2xl ${role === 'user'
            ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
            : 'bg-black/60 border-2 border-cyan-500/50 text-cyan-100'
            }`;
        bubble.textContent = text;

        messageDiv.appendChild(bubble);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.addTypingIndicator();

        try {
            const response = await fetch(`${this.apiUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    session_id: this.sessionId
                })
            });

            const data = await response.json();

            // Remove typing indicator
            this.removeTypingIndicator();

            if (data.success) {
                this.addMessage(data.response, 'assistant');

                // Handle approved cafes if AI filtered them
                if (data.approved_cafes && data.approved_cafes.length > 0) {
                    console.log('✅ Approved cafes:', data.approved_cafes);
                    this.approvedCafes.clear();
                    data.approved_cafes.forEach(id => this.approvedCafes.add(id));
                    this.filterActive = true;
                    this.updateCafeCards();

                    // Show notification
                    this.showNotification(`Found ${data.approved_cafes.length} perfect matches for you! ✨`);
                }
            } else {
                this.addMessage('Oops! Something went wrong 😅', 'assistant');
            }
        } catch (error) {
            this.removeTypingIndicator();
            this.addMessage('Connection error! Try again? 🔌', 'assistant');
        }
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-fade-in border-2 border-pink-400';
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <i class="fas fa-check-circle text-2xl"></i>
                <span class="font-bold">${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('opacity-0', 'transition-opacity');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    addTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        const indicator = document.createElement('div');
        indicator.id = 'typingIndicator';
        indicator.className = 'flex justify-start animate-fade-in';
        indicator.innerHTML = `
            <div class="bg-black/60 border-2 border-cyan-500/50 px-6 py-4 rounded-2xl">
                <div class="flex gap-2">
                    <div class="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    <div class="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }

    async handleQuickAction(action) {
        const preferences = {};
        let message = '';

        switch (action) {
            case 'veg':
                preferences.veg_only = true;
                message = 'Show me only vegetarian cafes';
                break;
            case 'rating':
                preferences.min_rating = 4.0;
                message = 'I want cafes with 4+ rating';
                break;
            case 'budget':
                preferences.max_price = 300;
                message = 'Show me budget-friendly cafes under ₹300';
                break;
            case 'nearby':
                message = 'Which cafes are closest to me?';
                break;
        }

        // Send message
        this.addMessage(message, 'user');
        this.addTypingIndicator();

        try {
            // Apply filter if preferences exist
            if (Object.keys(preferences).length > 0) {
                const filterResponse = await fetch(`${this.apiUrl}/filter`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        preferences: preferences,
                        session_id: this.sessionId
                    })
                });

                const filterData = await filterResponse.json();

                if (filterData.success) {
                    // Update rejected cafes
                    filterData.rejected.forEach(id => this.rejectedCafes.add(id));
                    this.updateCafeCards();
                }
            }

            // Get AI response
            const chatResponse = await fetch(`${this.apiUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    session_id: this.sessionId
                })
            });

            const chatData = await chatResponse.json();

            this.removeTypingIndicator();

            if (chatData.success) {
                this.addMessage(chatData.response, 'assistant');
            }
        } catch (error) {
            this.removeTypingIndicator();
            this.addMessage('Oops! Something went wrong 😅', 'assistant');
        }
    }

    updateCafeCards() {
        // Make approved cafes GLOW beautifully
        document.querySelectorAll('.restaurant-card').forEach(card => {
            const cafeId = card.dataset.cafeId;

            if (this.filterActive && this.approvedCafes.has(cafeId)) {
                // Add glowing approved badge
                if (!card.querySelector('.approved-badge')) {
                    const badge = document.createElement('div');
                    badge.className = 'approved-badge absolute top-4 left-4 z-10 animate-fade-in';
                    badge.innerHTML = `
                        <div class="bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border-2 border-green-300 shadow-lg animate-pulse">
                            <i class="fas fa-check-circle mr-1"></i> Approved by Bae
                        </div>
                    `;
                    card.querySelector('.relative').appendChild(badge);
                }

                // Add glowing effect to the whole card
                card.classList.add('approved-glow');
                card.style.animation = 'approvedGlow 2s ease-in-out infinite';
            }
        });

        // Add glow animation if not exists
        if (!document.getElementById('glow-styles')) {
            const style = document.createElement('style');
            style.id = 'glow-styles';
            style.textContent = `
                @keyframes approvedGlow {
                    0%, 100% {
                        box-shadow: 0 0 20px rgba(34, 197, 94, 0.4), 
                                    0 0 40px rgba(34, 197, 94, 0.2),
                                    0 10px 30px rgba(0, 0, 0, 0.3);
                        border-color: rgba(34, 197, 94, 0.5);
                    }
                    50% {
                        box-shadow: 0 0 30px rgba(34, 197, 94, 0.6), 
                                    0 0 60px rgba(34, 197, 94, 0.4),
                                    0 15px 40px rgba(0, 0, 0, 0.4);
                        border-color: rgba(34, 197, 94, 0.8);
                    }
                }
                .approved-glow {
                    border: 2px solid rgba(34, 197, 94, 0.5);
                    transform: scale(1.02);
                    transition: all 0.3s ease;
                }
            `;
            document.head.appendChild(style);
        }
    }

    async loadMore() {
        this.currentPage++;
        await this.handleSearch(false);
    }

    displayResults(restaurants, append = false) {
        const container = document.getElementById('resultsContainer');

        if (!restaurants || restaurants.length === 0) {
            if (!append) {
                container.innerHTML = this.createEmptyState();
            }
            return;
        }

        const cardsHTML = restaurants.map(restaurant => this.createRestaurantCard(restaurant)).join('');

        if (append) {
            container.innerHTML += cardsHTML;
        } else {
            container.innerHTML = cardsHTML;
        }

        // Animate new cards
        setTimeout(() => {
            document.querySelectorAll('.restaurant-card').forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('animate-fade-in');
                }, index * 50);
            });
        }, 10);
    }

    createRestaurantCard(restaurant) {
        const {
            id = '',
            name = 'Unknown Restaurant',
            cuisine = 'Various',
            rating = 'N/A',
            address = 'Address not available',
            priceRange = 'N/A',
            image = 'https://via.placeholder.com/400x300?text=No+Image',
            distance = '',
            deliveryTime = '',
            isOpen = true
        } = restaurant;

        const ratingColor = rating >= 4.0 ? 'from-green-500 to-emerald-500' : rating >= 3.5 ? 'from-yellow-500 to-orange-500' : 'from-orange-500 to-red-500';
        const statusBadge = !isOpen ? '<span class="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-red-400">Offline</span>' : '';
        const opacity = !isOpen ? 'opacity-50' : '';

        return `
            <div class="restaurant-card card-hover bg-black/60 backdrop-blur-xl rounded-2xl overflow-hidden ${opacity}" data-cafe-id="${id}">
                <div class="relative">
                    <img src="${image}" alt="${name}" class="w-full h-56 object-cover" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    ${statusBadge}
                    ${rating !== 'N/A' ? `
                        <div class="absolute bottom-4 left-4 bg-gradient-to-r ${ratingColor} text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border-2 border-white/30">
                            <i class="fas fa-star"></i>
                            <span>${rating}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="p-6">
                    <h3 class="text-2xl font-bold text-white mb-3 line-clamp-1 uppercase tracking-wide">${this.escapeHtml(name)}</h3>
                    <p class="text-gray-400 text-sm mb-3 line-clamp-1 flex items-center gap-2">
                        <i class="fas fa-utensils text-pink-500"></i>
                        <span class="uppercase tracking-wider">${this.escapeHtml(cuisine)}</span>
                    </p>
                    <p class="text-gray-500 text-sm mb-4 line-clamp-1 flex items-center gap-2">
                        <i class="fas fa-map-marker-alt text-cyan-500"></i>
                        <span>${this.escapeHtml(address)}</span>
                    </p>
                    <div class="flex items-center justify-between pt-4 border-t border-gray-800">
                        <div class="flex items-center gap-4 text-sm text-gray-400">
                            ${distance && distance !== 'N/A' ? `
                                <span class="flex items-center gap-1 bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-500/30">
                                    <i class="fas fa-location-arrow text-blue-400"></i>
                                    ${distance}
                                </span>
                            ` : ''}
                            ${deliveryTime && deliveryTime !== 'N/A mins' ? `
                                <span class="flex items-center gap-1 bg-green-900/30 px-3 py-1 rounded-lg border border-green-500/30">
                                    <i class="fas fa-clock text-green-400"></i>
                                    ${deliveryTime}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="mt-4 text-pink-400 font-bold text-lg uppercase tracking-wider">
                        ${this.escapeHtml(priceRange)}
                    </div>
                </div>
            </div>
        `;
    }

    createEmptyState() {
        return `
            <div class="col-span-full text-center py-24">
                <i class="fas fa-coffee text-gray-700 text-7xl mb-6 opacity-30"></i>
                <p class="text-gray-500 text-xl font-bold uppercase tracking-wider">No Cafes Located</p>
                <p class="text-gray-600 text-sm mt-3 uppercase tracking-wider">Try Different Coordinates</p>
            </div>
        `;
    }

    updateResultsHeader() {
        const header = document.getElementById('resultsHeader');
        const count = document.getElementById('resultsCount');

        if (this.totalResults > 0) {
            header.classList.remove('hidden');
            count.textContent = this.totalResults;
        } else {
            header.classList.add('hidden');
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        loading.classList.toggle('hidden', !show);
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.querySelector('p').textContent = message;
        errorElement.classList.remove('hidden');
        setTimeout(() => this.hideError(), 5000);
    }

    hideError() {
        const errorElement = document.getElementById('errorMessage');
        errorElement.classList.add('hidden');
    }

    clearResults() {
        const container = document.getElementById('resultsContainer');
        container.innerHTML = '';
        document.getElementById('resultsHeader').classList.add('hidden');
    }

    showNoMoreResults() {
        document.getElementById('noMoreResults').classList.remove('hidden');
    }

    hideNoMoreResults() {
        document.getElementById('noMoreResults').classList.add('hidden');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupMenuModal() {
        // Menu modal functionality placeholder
        // Can be extended later for detailed menu viewing
    }

    async openMenu(cafeId) {
        console.log('Opening menu for cafe:', cafeId);
        // Menu opening logic can be added here
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CafeBae();
});
