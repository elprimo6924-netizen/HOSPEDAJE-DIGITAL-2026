/**
 * COMPONENTS.JS - Componentes Reutilizables P0
 * SearchBar, PropertyCard, BookingWidget
 */

/* ═══════════════════════════════════════
   PROPERTY CARD COMPONENT
   ═══════════════════════════════════════ */

class PropertyCard {
    constructor(data) {
        this.data = {
            id: data.id || '',
            title: data.title || 'Propiedad sin nombre',
            description: data.description || '',
            image: data.image || 'https://via.placeholder.com/400x300?text=No+Image',
            price: data.price || 0,
            rating: data.rating || 0,
            reviews: data.reviews || 0,
            location: data.location || '',
            available: data.available !== false,
            badge: data.badge || null,
            amenities: data.amenities || [],
            favorite: false
        };
    }

    render() {
        const card = document.createElement('div');
        card.className = 'property-card';
        card.setAttribute('data-property-id', this.data.id);

        const availabilityClass = this.data.available ? '' : 'opacity-50';
        const badgeHTML = this.data.badge ? `
            <span class="badge ${this.getBadgeClass()}">
                ${this.data.badge}
            </span>
        ` : '';

        const ratingHTML = this.data.rating > 0 ? `
            <div class="property-rating">
                <div class="rating-stars">
                    ${this.renderStars()}
                </div>
                <span class="rating-text">${this.data.rating.toFixed(1)}</span>
                <span class="rating-count">(${this.data.reviews})</span>
            </div>
        ` : '';

        const amenitiesHTML = this.data.amenities.length > 0 ? `
            <div class="property-amenities">
                ${this.data.amenities.map(a => `
                    <span class="amenity-badge">
                        <i class="${a.icon}"></i>
                        ${a.label}
                    </span>
                `).join('')}
            </div>
        ` : '';

        card.innerHTML = `
            <div class="property-image-wrapper">
                <img src="${this.data.image}" alt="${this.data.title}" class="property-image" loading="lazy">
                ${badgeHTML ? `<div class="property-badge">${badgeHTML}</div>` : ''}
                <button class="property-favorite" aria-label="Agregar a favoritos" data-id="${this.data.id}">
                    <i class="fa-${this.data.favorite ? 'solid' : 'regular'} fa-heart"></i>
                </button>
            </div>
            
            <div class="property-info">
                ${this.data.location ? `
                    <div class="property-location">
                        <i class="fa-solid fa-location-dot"></i>
                        ${this.data.location}
                    </div>
                ` : ''}
                
                <h3 class="property-title">${this.escapeHtml(this.data.title)}</h3>
                
                ${this.data.description ? `
                    <p class="property-description">${this.escapeHtml(this.data.description)}</p>
                ` : ''}
                
                ${ratingHTML}
                
                <div class="property-price">
                    <span class="price-amount">$${this.formatPrice(this.data.price)}</span>
                    <span class="price-currency">USD</span>
                    <span class="price-unit">/noche</span>
                </div>
                
                ${amenitiesHTML}
                
                <div class="property-actions">
                    <button class="btn btn-secondary btn-block" data-action="view">
                        <i class="fa-solid fa-eye"></i>
                        Ver detalles
                    </button>
                    <button class="btn btn-primary btn-block" data-action="book" ${!this.data.available ? 'disabled' : ''}>
                        <i class="fa-solid fa-calendar"></i>
                        Reservar
                    </button>
                </div>
            </div>
        `;

        this.element = card;
        this.attachEventListeners();
        return card;
    }

    renderStars() {
        const fullStars = Math.floor(this.data.rating);
        const hasHalf = this.data.rating % 1 >= 0.5;
        let html = '';

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                html += '<i class="fa-solid fa-star star"></i>';
            } else if (i === fullStars && hasHalf) {
                html += '<i class="fa-solid fa-star-half-stroke star"></i>';
            } else {
                html += '<i class="fa-regular fa-star star empty"></i>';
            }
        }
        return html;
    }

    getBadgeClass() {
        const badge = this.data.badge?.toLowerCase() || '';
        if (badge.includes('nuevo')) return 'badge-info';
        if (badge.includes('oferta')) return 'badge-warning';
        if (badge.includes('popular')) return 'badge-success';
        return 'badge-info';
    }

    attachEventListeners() {
        const favoriteBtn = this.element.querySelector('.property-favorite');
        const viewBtn = this.element.querySelector('[data-action="view"]');
        const bookBtn = this.element.querySelector('[data-action="book"]');

        favoriteBtn?.addEventListener('click', () => this.toggleFavorite());
        viewBtn?.addEventListener('click', () => this.onView());
        bookBtn?.addEventListener('click', () => this.onBook());
    }

    toggleFavorite() {
        this.data.favorite = !this.data.favorite;
        const favoriteBtn = this.element.querySelector('.property-favorite');
        const icon = favoriteBtn.querySelector('i');
        
        if (this.data.favorite) {
            icon.className = 'fa-solid fa-heart';
            favoriteBtn.classList.add('liked');
        } else {
            icon.className = 'fa-regular fa-heart';
            favoriteBtn.classList.remove('liked');
        }
    }

    onView() {
        console.log('Ver propiedad:', this.data.id);
        window.location.href = `pages/property-detail.html?id=${this.data.id}`;
    }

    onBook() {
        console.log('Reservar propiedad:', this.data.id);
        window.location.href = `pages/reserva-form.html?property=${this.data.id}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }
}

/* ═══════════════════════════════════════
   SEARCH BAR COMPONENT
   ═══════════════════════════════════════ */

class SearchBar {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            onSearch: options.onSearch || (() => {}),
            minDate: options.minDate || new Date(),
            ...options
        };

        this.state = {
            destination: '',
            checkIn: '',
            checkOut: '',
            guests: 1
        };

        this.init();
    }

    init() {
        this.destinationInput = this.container.querySelector('#search-destination');
        this.checkInInput = this.container.querySelector('#search-checkin');
        this.checkOutInput = this.container.querySelector('#search-checkout');
        this.guestsSelect = this.container.querySelector('#search-guests');
        this.searchBtn = this.container.querySelector('#search-btn');

        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        this.checkInInput.setAttribute('min', today);
        this.checkOutInput.setAttribute('min', today);
        this.checkInInput.value = today;

        this.attachEventListeners();
    }

    attachEventListeners() {
        this.destinationInput.addEventListener('input', (e) => this.onDestinationChange(e));
        this.checkInInput.addEventListener('change', (e) => this.onCheckInChange(e));
        this.checkOutInput.addEventListener('change', (e) => this.onCheckOutChange(e));
        this.guestsSelect.addEventListener('change', (e) => this.onGuestsChange(e));
        this.searchBtn.addEventListener('click', () => this.onSearch());

        // Allow Enter key to trigger search
        this.destinationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.onSearch();
        });
    }

    onDestinationChange(e) {
        this.state.destination = e.target.value;
        // TODO: Implementar autocomplete
    }

    onCheckInChange(e) {
        this.state.checkIn = e.target.value;
        // Update checkout minimum date
        if (this.state.checkIn) {
            const checkInDate = new Date(this.state.checkIn);
            checkInDate.setDate(checkInDate.getDate() + 1);
            const minCheckOut = checkInDate.toISOString().split('T')[0];
            this.checkOutInput.setAttribute('min', minCheckOut);
            
            if (this.state.checkOut && this.state.checkOut <= this.state.checkIn) {
                this.checkOutInput.value = minCheckOut;
                this.state.checkOut = minCheckOut;
            }
        }
    }

    onCheckOutChange(e) {
        this.state.checkOut = e.target.value;
    }

    onGuestsChange(e) {
        this.state.guests = parseInt(e.target.value);
    }

    onSearch() {
        if (!this.validate()) return;

        console.log('Search:', this.state);
        this.options.onSearch(this.state);

        // Emit custom event
        const event = new CustomEvent('search-performed', { 
            detail: this.state,
            bubbles: true 
        });
        this.container.dispatchEvent(event);
    }

    validate() {
        if (!this.state.destination.trim()) {
            alert('Por favor, ingresa un destino');
            this.destinationInput.focus();
            return false;
        }

        if (!this.state.checkIn) {
            alert('Por favor, selecciona una fecha de check-in');
            return false;
        }

        if (!this.state.checkOut) {
            alert('Por favor, selecciona una fecha de check-out');
            return false;
        }

        if (this.state.checkOut <= this.state.checkIn) {
            alert('La fecha de check-out debe ser posterior a check-in');
            return false;
        }

        return true;
    }

    getState() {
        return { ...this.state };
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.updateUI();
    }

    updateUI() {
        this.destinationInput.value = this.state.destination;
        this.checkInInput.value = this.state.checkIn;
        this.checkOutInput.value = this.state.checkOut;
        this.guestsSelect.value = this.state.guests;
    }
}

/* ═══════════════════════════════════════
   BOOKING WIDGET COMPONENT
   ═══════════════════════════════════════ */

class BookingWidget {
    constructor(containerId, propertyData = {}) {
        this.container = document.getElementById(containerId);
        this.propertyData = {
            price: propertyData.price || 0,
            currency: propertyData.currency || 'USD',
            availability: propertyData.availability || [],
            ...propertyData
        };

        this.state = {
            checkIn: '',
            checkOut: '',
            guests: 1,
            nights: 0,
            subtotal: 0,
            tax: 0,
            total: 0
        };

        this.init();
    }

    init() {
        if (!this.container) return;
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="booking-widget">
                <h3 class="booking-widget-title">
                    <i class="fa-solid fa-credit-card"></i>
                    Reserva tu estadía
                </h3>
                
                <div class="booking-dates">
                    <div class="booking-date-field">
                        <label>Check-in</label>
                        <input type="date" id="booking-checkin" class="form-input" required>
                    </div>
                    <div class="booking-date-field">
                        <label>Check-out</label>
                        <input type="date" id="booking-checkout" class="form-input" required>
                    </div>
                </div>
                
                <div class="booking-guests">
                    <span class="booking-guest-label">Huéspedes</span>
                    <div class="booking-guest-selector">
                        <button class="guest-btn" id="guests-minus" type="button">−</button>
                        <span class="guest-count" id="guest-count">1</span>
                        <button class="guest-btn" id="guests-plus" type="button">+</button>
                    </div>
                </div>
                
                <div class="booking-summary">
                    <div class="booking-summary-row">
                        <span>$${this.propertyData.price} × <span id="nights-count">1</span> noches</span>
                        <span id="subtotal">$${this.propertyData.price}</span>
                    </div>
                    <div class="booking-summary-row">
                        <span>Impuestos y cargos</span>
                        <span id="tax-amount">$0</span>
                    </div>
                    <div class="booking-summary-row">
                        <span>Total:</span>
                        <span id="total-amount">$${this.propertyData.price}</span>
                    </div>
                </div>
                
                <button class="btn btn-primary booking-widget-cta" id="book-now-btn">
                    <i class="fa-solid fa-check"></i>
                    Reservar ahora
                </button>
                
                <p class="booking-note">Puedes cambiar o cancelar gratis antes de 24h</p>
            </div>
        `;
    }

    attachEventListeners() {
        const checkInInput = this.container.querySelector('#booking-checkin');
        const checkOutInput = this.container.querySelector('#booking-checkout');
        const guestsPlusBtn = this.container.querySelector('#guests-plus');
        const guestsMinusBtn = this.container.querySelector('#guests-minus');
        const bookNowBtn = this.container.querySelector('#book-now-btn');

        // Set minimum date
        const today = new Date().toISOString().split('T')[0];
        checkInInput.setAttribute('min', today);
        checkOutInput.setAttribute('min', today);

        checkInInput.addEventListener('change', () => this.updateSummary());
        checkOutInput.addEventListener('change', () => this.updateSummary());
        guestsPlusBtn.addEventListener('click', () => this.incrementGuests());
        guestsMinusBtn.addEventListener('click', () => this.decrementGuests());
        bookNowBtn.addEventListener('click', () => this.onBookNow());
    }

    updateSummary() {
        const checkInInput = this.container.querySelector('#booking-checkin');
        const checkOutInput = this.container.querySelector('#booking-checkout');

        this.state.checkIn = checkInInput.value;
        this.state.checkOut = checkOutInput.value;

        if (this.state.checkIn && this.state.checkOut && this.state.checkOut > this.state.checkIn) {
            const checkIn = new Date(this.state.checkIn);
            const checkOut = new Date(this.state.checkOut);
            const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

            this.state.nights = nights;
            this.state.subtotal = this.propertyData.price * nights;
            this.state.tax = Math.round(this.state.subtotal * 0.10); // 10% tax
            this.state.total = this.state.subtotal + this.state.tax;

            this.container.querySelector('#nights-count').textContent = nights;
            this.container.querySelector('#subtotal').textContent = `$${this.state.subtotal}`;
            this.container.querySelector('#tax-amount').textContent = `$${this.state.tax}`;
            this.container.querySelector('#total-amount').textContent = `$${this.state.total}`;
        }
    }

    incrementGuests() {
        this.state.guests = Math.min(this.state.guests + 1, 10);
        this.container.querySelector('#guest-count').textContent = this.state.guests;
    }

    decrementGuests() {
        this.state.guests = Math.max(this.state.guests - 1, 1);
        this.container.querySelector('#guest-count').textContent = this.state.guests;
    }

    onBookNow() {
        if (!this.validate()) return;

        console.log('Booking:', this.state);

        // Emit custom event
        const event = new CustomEvent('booking-initiated', { 
            detail: this.state,
            bubbles: true 
        });
        this.container.dispatchEvent(event);

        // Navigate to booking form
        window.location.href = `reserva-form.html?checkin=${this.state.checkIn}&checkout=${this.state.checkOut}&guests=${this.state.guests}`;
    }

    validate() {
        if (!this.state.checkIn || !this.state.checkOut) {
            alert('Por favor, selecciona fechas de check-in y check-out');
            return false;
        }

        if (this.state.checkOut <= this.state.checkIn) {
            alert('La fecha de check-out debe ser posterior a check-in');
            return false;
        }

        return true;
    }

    getState() {
        return { ...this.state };
    }
}

/* ═══════════════════════════════════════
   MODAL COMPONENT
   ═══════════════════════════════════════ */

class Modal {
    constructor(options = {}) {
        this.options = {
            title: options.title || '',
            content: options.content || '',
            size: options.size || 'md', // sm, md, lg, xl
            closeButton: options.closeButton !== false,
            backdrop: options.backdrop !== false,
            onClose: options.onClose || (() => {}),
            onOpen: options.onOpen || (() => {}),
            ...options
        };

        this.isOpen = false;
        this.create();
    }

    create() {
        // Backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'modal-backdrop hidden';
        this.backdrop.addEventListener('click', (e) => {
            if (e.target === this.backdrop && this.options.backdrop) {
                this.close();
            }
        });

        // Modal
        this.modal = document.createElement('div');
        this.modal.className = `modal modal-${this.options.size}`;

        // Header
        if (this.options.title) {
            const header = document.createElement('div');
            header.className = 'modal-header';
            header.innerHTML = `
                <h3 class="modal-title">${this.options.title}</h3>
                ${this.options.closeButton ? '<button type="button" class="modal-close" aria-label="Cerrar modal"><i class="fa-solid fa-xmark"></i></button>' : ''}
            `;
            this.modal.appendChild(header);

            if (this.options.closeButton) {
                header.querySelector('.modal-close').addEventListener('click', () => this.close());
            }
        }

        // Body
        const body = document.createElement('div');
        body.className = 'modal-body';
        if (typeof this.options.content === 'string') {
            body.innerHTML = this.options.content;
        } else {
            body.appendChild(this.options.content);
        }
        this.modal.appendChild(body);

        // Footer
        if (this.options.footer) {
            const footer = document.createElement('div');
            footer.className = 'modal-footer';
            footer.innerHTML = this.options.footer;
            this.modal.appendChild(footer);
        }

        this.backdrop.appendChild(this.modal);
    }

    open() {
        if (this.isOpen) return;

        document.body.appendChild(this.backdrop);
        document.body.style.overflow = 'hidden';

        // Trigger animation
        setTimeout(() => {
            this.backdrop.classList.remove('hidden');
            this.modal.classList.add('modal-enter');
        }, 10);

        this.isOpen = true;
        this.options.onOpen();
    }

    close() {
        if (!this.isOpen) return;

        this.modal.classList.remove('modal-enter');
        this.modal.classList.add('modal-exit');

        setTimeout(() => {
            this.backdrop.classList.add('hidden');
            document.body.style.overflow = '';
            this.backdrop.remove();
            this.isOpen = false;
            this.options.onClose();
        }, 200);
    }

    setContent(content) {
        const body = this.modal.querySelector('.modal-body');
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else {
            body.innerHTML = '';
            body.appendChild(content);
        }
    }

    destroy() {
        if (this.isOpen) {
            this.close();
        }
        this.backdrop.remove();
    }
}

/* ═══════════════════════════════════════
   UTILITIES & HELPERS
   ═══════════════════════════════════════ */

function createPropertyCard(data) {
    const card = new PropertyCard(data);
    return card.render();
}

function formatDate(date) {
    return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
}

function calculateNights(checkIn, checkOut) {
    const ci = new Date(checkIn);
    const co = new Date(checkOut);
    return Math.ceil((co - ci) / (1000 * 60 * 60 * 24));
}

// Export for use
if (typeof window !== 'undefined') {
    window.PropertyCard = PropertyCard;
    window.SearchBar = SearchBar;
    window.BookingWidget = BookingWidget;
    window.Modal = Modal;
    window.createPropertyCard = createPropertyCard;
    window.formatDate = formatDate;
    window.calculateNights = calculateNights;
}
