/**
 * LANDING PAGE APP - Inicializador
 * Para uso con index-new.html (FASE 2)
 */

class LandingPageApp {
    constructor() {
        this.searchBar = null;
        this.properties = [];
        console.log('[LandingApp] Iniciando...');
        this.init();
    }

    async init() {
        // Inicializar SearchBar
        this.initSearchBar();

        // Cargar propiedades
        await this.loadProperties();

        // Manejo de eventos
        this.attachEventListeners();

        console.log('[LandingApp] ✅ Inicialización completa');
    }

    initSearchBar() {
        try {
            this.searchBar = new SearchBar('search-bar', {
                onSearch: (searchState) => this.onSearch(searchState)
            });
            console.log('[LandingApp] SearchBar inicializado');
        } catch (error) {
            console.warn('[LandingApp] Error inicializando SearchBar:', error);
        }
    }

    async loadProperties() {
        try {
            console.log('[LandingApp] Cargando propiedades...');

            // Intentar cargar del API
            const response = await requestJson('/propiedades');

            if (response && Array.isArray(response)) {
                this.properties = response;
            } else if (response) {
                this.properties = Array.isArray(response.data) ? response.data : [response];
            } else {
                // Usar datos de demostración si la API no responde
                this.properties = this.getDemoProperties();
            }

            this.renderProperties();
        } catch (error) {
            console.warn('[LandingApp] API no disponible, usando datos de demostración');
            this.properties = this.getDemoProperties();
            this.renderProperties();
        }
    }

    getDemoProperties() {
        return [
            {
                id: '1',
                nombre: 'Casa de Montaña Exclusiva',
                descripcion: 'Hermosa casa ubicada en la cordillera con vistas panorámicas espectaculares',
                imagen: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
                precio: 150,
                calificacion: 4.8,
                resenas: 124,
                ubicacion: 'Bogotá',
                disponible: true,
                amenidades: ['wifi', 'aire', 'cocina', 'parking']
            },
            {
                id: '2',
                nombre: 'Apartamento Céntrico Moderno',
                descripcion: 'Loft minimalista en el corazón de la ciudad con acceso a metro y comercios',
                imagen: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
                precio: 95,
                calificacion: 4.5,
                resenas: 89,
                ubicacion: 'Medellín',
                disponible: true,
                amenidades: ['wifi', 'tv', 'gym', 'parking']
            },
            {
                id: '3',
                nombre: 'Cabaña Rústica al Mar',
                descripcion: 'Refugio perfecto a pocos metros de la playa, con acceso privado a la arena',
                imagen: 'https://images.unsplash.com/photo-1470117855212-5953dc762956?w=400&h=300&fit=crop',
                precio: 120,
                calificacion: 4.9,
                resenas: 156,
                ubicacion: 'Cartagena',
                disponible: true,
                amenidades: ['piscina', 'balcon', 'aire', 'cocina']
            },
            {
                id: '4',
                nombre: 'Penthouse Ejecutivo',
                descripcion: 'Lujoso penthouse con terraza privada, vista a la ciudad y servicios premium',
                imagen: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop',
                precio: 250,
                calificacion: 5.0,
                resenas: 52,
                ubicacion: 'Bogotá',
                disponible: true,
                amenidades: ['wifi', 'gym', 'cocina', 'escritorio'],
                insignia: 'Premium'
            },
            {
                id: '5',
                nombre: 'Studio Artístico',
                descripcion: 'Espacio creativo con loft, perfecto para artistas y profesionales remotos',
                imagen: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
                precio: 75,
                calificacion: 4.6,
                resenas: 67,
                ubicacion: 'Cali',
                disponible: true,
                amenidades: ['wifi', 'escritorio', 'aire', 'lavanderia']
            },
            {
                id: '6',
                nombre: 'Villa Familiar Completa',
                descripcion: 'Amplia villa de 4 habitaciones ideal para familias, con patio y áreas comunes',
                imagen: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
                precio: 180,
                calificacion: 4.7,
                resenas: 101,
                ubicacion: 'Santa Marta',
                disponible: true,
                amenidades: ['piscina', 'parking', 'cocina', 'balcon'],
                insignia: 'Oferta'
            }
        ];
    }

    renderProperties() {
        const container = document.getElementById('properties-container');
        if (!container) return;

        container.innerHTML = '';

        if (this.properties.length === 0) {
            this.showEmptyState();
            return;
        }

        // Actualizar contador en hero
        const propCountEl = document.getElementById('prop-count');
        if (propCountEl) {
            propCountEl.textContent = this.properties.length;
        }

        // Renderizar tarjetas
        this.properties.forEach(property => {
            const card = new PropertyCard({
                id: property.id || property._id,
                title: property.nombre || property.name,
                description: property.descripcion || property.description,
                image: property.imagen || property.image,
                price: property.precio || property.price || 0,
                rating: property.calificacion || property.rating || 0,
                reviews: property.resenas || property.reviews || 0,
                location: property.ubicacion || property.location || '',
                available: property.disponible !== false,
                badge: property.insignia || property.badge,
                amenities: this.parseAmenities(property.amenidades || property.amenities || [])
            });

            container.appendChild(card.render());
        });

        console.log(`[LandingApp] ${this.properties.length} propiedades renderizadas`);
    }

    parseAmenities(amenities) {
        const amenityIcons = {
            'wifi': 'fa-wifi',
            'aire': 'fa-fan',
            'tv': 'fa-tv',
            'cocina': 'fa-utensils',
            'parking': 'fa-car',
            'piscina': 'fa-water',
            'gym': 'fa-dumbbell',
            'lavanderia': 'fa-soap',
            'escritorio': 'fa-desk',
            'balcon': 'fa-door-open'
        };

        return Array.isArray(amenities) 
            ? amenities.slice(0, 3).map(a => ({
                label: typeof a === 'string' ? a : a.nombre || a.name || 'Servicio',
                icon: `fa-solid ${amenityIcons[typeof a === 'string' ? a.toLowerCase() : (a.nombre || a.name || '').toLowerCase()] || 'fa-check'}`
            }))
            : [];
    }

    onSearch(searchState) {
        console.log('[LandingApp] Búsqueda realizada:', searchState);

        const filtered = this.properties.filter(p => {
            const location = (p.ubicacion || p.location || '').toLowerCase();
            const name = (p.nombre || p.name || '').toLowerCase();
            const searchTerm = searchState.destination.toLowerCase();

            return location.includes(searchTerm) || name.includes(searchTerm);
        });

        if (filtered.length > 0) {
            this.renderFilteredProperties(filtered);
        } else {
            this.showNoResultsState(searchState.destination);
        }

        // Scroll a resultados
        setTimeout(() => {
            document.getElementById('propiedades')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    renderFilteredProperties(properties) {
        const container = document.getElementById('properties-container');
        if (!container) return;

        container.innerHTML = '';

        properties.forEach(property => {
            const card = new PropertyCard({
                id: property.id || property._id,
                title: property.nombre || property.name,
                description: property.descripcion || property.description,
                image: property.imagen || property.image,
                price: property.precio || property.price || 0,
                rating: property.calificacion || property.rating || 0,
                reviews: property.resenas || property.reviews || 0,
                location: property.ubicacion || property.location || '',
                available: property.disponible !== false,
                badge: property.insignia || property.badge,
                amenities: this.parseAmenities(property.amenidades || property.amenities || [])
            });

            container.appendChild(card.render());
        });
    }

    showEmptyState() {
        const container = document.getElementById('properties-container');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state-wrapper" style="grid-column: 1 / -1;">
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fa-solid fa-inbox"></i>
                    </div>
                    <h3 class="empty-state-title">Sin propiedades disponibles</h3>
                    <p class="empty-state-text">Por el momento no hay propiedades cargadas. Intenta nuevamente más tarde.</p>
                </div>
            </div>
        `;
    }

    showNoResultsState(destination) {
        const container = document.getElementById('properties-container');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state-wrapper" style="grid-column: 1 / -1;">
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </div>
                    <h3 class="empty-state-title">No hay resultados para "${destination}"</h3>
                    <p class="empty-state-text">Intenta buscar otro destino o explora todas nuestras propiedades.</p>
                    <button class="btn btn-primary empty-state-action" onclick="location.reload()">
                        <i class="fa-solid fa-refresh"></i>
                        Ver todas las propiedades
                    </button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Contact form
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.onContactSubmit(e));
        }
    }

    onContactSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);

        console.log('[LandingApp] Contacto enviado');

        const successMsg = document.createElement('div');
        successMsg.className = 'success-alert';
        successMsg.innerHTML = `
            <div class="success-alert-icon">
                <i class="fa-solid fa-circle-check"></i>
            </div>
            <div>
                <div class="success-alert-title">¡Mensaje enviado!</div>
                <p style="margin: 0; font-size: var(--font-size-sm); color: var(--color-success-dark);">
                    Nos comunicaremos contigo en menos de 24 horas.
                </p>
            </div>
        `;

        form.replaceWith(successMsg);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.landingApp = new LandingPageApp();
    });
} else {
    window.landingApp = new LandingPageApp();
}
