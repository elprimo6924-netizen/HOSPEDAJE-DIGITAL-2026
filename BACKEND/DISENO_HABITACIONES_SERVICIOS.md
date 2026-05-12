# 🏨 Diseño dePáginas de Habitaciones y Servicios

## Guía Completa para Hospedaje Digital

---

## 1. Paleta de Colores Recomendada

La siguiente paleta está diseñada específicamente para sitios web de hospitalidad, transmitiendo confianza, comodidad y lujo accesible.

### Colores Principales

```css
:root {
    /* Color primario - Azul profundo (confianza y serenidad) */
    --color-primary: #1a365d;
    --color-primary-light: #2c5282;
    --color-primary-dark: #0d1b2a;
    
    /* Color secundario - Dorado cálido (lujo y elegancia) */
    --color-secondary: #c9a227;
    --color-secondary-light: #d4b94e;
    --color-secondary-dark: #9a7b1a;
    
    /* Color de acento - Verde esmeralda (naturaleza y relax) */
    --color-accent: #2d6a4f;
    --color-accent-light: #40916c;
    
    /* Colores neutros */
    --color-white: #ffffff;
    --color-cream: #faf8f5;
    --color-light-gray: #f1f3f5;
    --color-gray: #868e96;
    --color-dark-gray: #343a40;
    
    /* Estados */
    --color-success: #27ae60;
    --color-warning: #f39c12;
    --color-error: #e74c3c;
    --color-info: #3498db;
    
    /* Fondos */
    --bg-primary: var(--color-white);
    --bg-secondary: var(--color-cream);
    --bg-dark: var(--color-primary-dark);
}
```

### Significado de los Colores en Hospitalidad

| Color | Significado | Uso Recomendado |
|-------|-------------|-----------------|
| Azul profundo | Confianza, serenidad, profesionalismo | Header, botones principales, textos |
| Dorado | Lujo, exclusividad, hospitalidad premium | Acentos, precios, CTAs importantes |
| Verde | Relajación, naturaleza, bienestar | Servicios de spa, piscina, naturaleza |
| Blanco/Crema | Limpieza, espacio, comodidad | Fondos principales |

---

## 2. Tipografía Recomendada

### Familias Tipográficas

```css
:root {
    /* Encabezados - Elegante y distintiva */
    --font-heading: 'Playfair Display', Georgia, serif;
    
    /* Cuerpo del texto - Legible y profesional */
    --font-body: 'Source Sans Pro', 'Segoe UI', sans-serif;
    
    /* Texto secundario */
    --font-secondary: 'Lato', sans-serif;
    
    /* Tamaños base */
    --font-size-xs: 12px;
    --font-size-sm: 14px;
    --font-size-base: 16px;
    --font-size-lg: 18px;
    --font-size-xl: 20px;
    --font-size-2xl: 24px;
    --font-size-3xl: 30px;
    --font-size-4xl: 36px;
    --font-size-5xl: 48px;
    
    /* Pesos */
    --font-light: 300;
    --font-regular: 400;
    --font-medium: 500;
    --font-semibold: 600;
    --font-bold: 700;
    
    /* Line height */
    --line-height-tight: 1.2;
    --line-height-normal: 1.6;
    --line-height-relaxed: 1.8;
}
```

### Jerarquía Tipográfica

```
H1 (Título principal): Playfair Display, 48px, Bold
    ↓
H2 (Títulos de sección): Playfair Display, 36px, SemiBold
    ↓
H3 (Subtítulos): Playfair Display, 24px, Medium
    ↓
H4 (Títulos de tarjetas): Source Sans Pro, 20px, SemiBold
    ↓
Párrafo: Source Sans Pro, 16px, Regular
    ↓
Small/Caption: Source Sans Pro, 14px, Regular
```

---

## 3. Estructura de Página de Habitaciones

### Layout General (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER                                  │
│  [Logo]    [Inicio] [Habitaciones] [Servicios] [Contacto]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    HERO SECTION                                 │
│         "Descubre tu habitación perfecta"                      │
│         [Fecha entrada] [Fecha salida] [Huéspedes]             │
│                          [BUSCAR]                                │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FILTROS LATERAL                    GRID DE HABITACIONES       │
│  ┌─────────────────┐              ┌───────┐ ┌───────┐         │
│  │ Tipo de habitación│             │ 📷   │ │ 📷   │         │
│  │ □ Individual     │             │ Hab 1│ │ Hab 2│         │
│  │ □ Doble          │             │ $50  │ │ $80  │         │
│  │ □ Suite          │             └───────┘ └───────┘         │
│  │ □ Familiar       │              ┌───────┐ ┌───────┐         │
│  │                 │              │ 📷   │ │ 📷   │         │
│  │ Capacidad       │             │ Hab 3│ │ Hab 4│         │
│  │ [---o------] 1-8│             │ $120 │ │ $200 │         │
│  │                 │             └───────┘ └───────┘         │
│  │ Precio                                  │                   │
│  │ $[ ] - $[ ]                            │                   │
│  │                 │                       │                   │
│  │ Amenidades      │                       │                   │
│  │ □ WiFi          │                       │                   │
│  │ □ Piscina       │                       │                   │
│  │ □ Spa           │                       │                   │
│  │ □ Restaurante   │                       │                   │
│  └─────────────────┘                       │                   │
│                                              │                   │
├─────────────────────────────────────────────────────────────────┤
│                         FOOTER                                   │
│   [Links] [Redes sociales] [Newsletter] [Contacto]           │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes de la Página de Habitaciones

#### 3.1 Hero Section con Búsqueda

```html
<!-- Hero Section con formulario de búsqueda -->
<section class="hero-rooms">
    <div class="hero-overlay"></div>
    <div class="hero-content">
        <h1>Descubre tu habitación perfecta</h1>
        <p class="hero-subtitle">Experimenta el lujo y la comodidad en cada espacio</p>
        
        <!-- Barra de búsqueda flotante -->
        <form class="search-bar" id="search-form">
            <div class="search-field">
                <label for="checkin">Entrada</label>
                <input type="date" id="checkin" name="checkin" required>
            </div>
            
            <div class="search-field">
                <label for="checkout">Salida</label>
                <input type="date" id="checkout" name="checkout" required>
            </div>
            
            <div class="search-field">
                <label for="guests">Huéspedes</label>
                <select id="guests" name="guests">
                    <option value="1">1 huésped</option>
                    <option value="2" selected>2 huéspedes</option>
                    <option value="3">3 huéspedes</option>
                    <option value="4">4 huéspedes</option>
                    <option value="5+">5+ huéspedes</option>
                </select>
            </div>
            
            <button type="submit" class="btn-search">
                <span class="icon">🔍</span> Buscar
            </button>
        </form>
    </div>
</section>
```

```css
/* Estilos del Hero */
.hero-rooms {
    position: relative;
    height: 500px;
    background-image: url('../assets/images/hero-rooms.jpg');
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
}

.hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(26, 54, 93, 0.85), rgba(13, 27, 42, 0.7));
}

.hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    color: var(--color-white);
    max-width: 800px;
    padding: 0 20px;
}

.hero-content h1 {
    font-family: var(--font-heading);
    font-size: var(--font-size-4xl);
    font-weight: var(--font-bold);
    margin-bottom: var(--spacing-md);
}

.hero-subtitle {
    font-size: var(--font-size-xl);
    font-weight: var(--font-light);
    margin-bottom: var(--spacing-xl);
    opacity: 0.9;
}

/* Barra de búsqueda */
.search-bar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    background: var(--color-white);
    padding: var(--spacing-lg);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-lg);
    justify-content: center;
    align-items: flex-end;
}

.search-field {
    display: flex;
    flex-direction: column;
    min-width: 150px;
}

.search-field label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-semibold);
    color: var(--color-dark-gray);
    margin-bottom: var(--spacing-xs);
}

.search-field input,
.search-field select {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 2px solid var(--color-light-gray);
    border-radius: var(--border-radius);
    font-size: var(--font-size-base);
    transition: border-color 0.3s;
}

.search-field input:focus,
.search-field select:focus {
    outline: none;
    border-color: var(--color-secondary);
}

.btn-search {
    background: var(--color-secondary);
    color: var(--color-white);
    border: none;
    padding: var(--spacing-md) var(--spacing-xl);
    font-size: var(--font-size-lg);
    font-weight: var(--font-semibold);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: background 0.3s, transform 0.2s;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.btn-search:hover {
    background: var(--color-secondary-dark);
    transform: translateY(-2px);
}
```

#### 3.2 Panel de Filtros

```html
<!-- Panel de Filtros -->
<aside class="filters-panel">
    <div class="filters-header">
        <h3>Filtros</h3>
        <button class="btn-clear-filters">Limpiar todo</button>
    </div>
    
    <!-- Filtro por Tipo de Habitación -->
    <div class="filter-group">
        <h4>Tipo de habitación</h4>
        <div class="filter-options">
            <label class="filter-checkbox">
                <input type="checkbox" name="roomType" value="individual">
                <span class="checkmark"></span>
                Individual
            </label>
            <label class="filter-checkbox">
                <input type="checkbox" name="roomType" value="doble">
                <span class="checkmark"></span>
                Doble
            </label>
            <label class="filter-checkbox">
                <input type="checkbox" name="roomType" value="suite">
                <span class="checkmark"></span>
                Suite
            </label>
            <label class="filter-checkbox">
                <input type="checkbox" name="roomType" value="familiar">
                <span class="checkmark"></span>
                Familiar
            </label>
        </div>
    </div>
    
    <!-- Filtro por Capacidad -->
    <div class="filter-group">
        <h4>Número de huéspedes</h4>
        <div class="range-slider">
            <input type="range" id="guestsRange" min="1" max="8" value="2">
            <div class="range-labels">
                <span>1</span>
                <span id="guestsValue">2</span>
                <span>8+</span>
            </div>
        </div>
    </div>
    
    <!-- Filtro por Precio -->
    <div class="filter-group">
        <h4>Precio por noche</h4>
        <div class="price-inputs">
            <input type="number" placeholder="Mín" id="priceMin">
            <span>-</span>
            <input type="number" placeholder="Máx" id="priceMax">
        </div>
        <input type="range" id="priceRange" min="0" max="500" value="500">
    </div>
    
    <!-- Filtro por Amenidades -->
    <div class="filter-group">
        <h4>Amenidades</h4>
        <div class="filter-options">
            <label class="filter-checkbox">
                <input type="checkbox" name="amenity" value="wifi">
                <span>📶</span> WiFi
            </label>
            <label class="filter-checkbox">
                <input type="checkbox" name="amenity" value="ac">
                <span>❄️</span> Aire acondicionado
            </label>
            <label class="filter-checkbox">
                <input type="checkbox" name="amenity" value="tv">
                <span>📺</span> TV
            </label>
            <label class="filter-checkbox">
                <input type="checkbox" name="amenity" value="minibar">
                <span>🍷</span> Minibar
            </label>
            <label class="filter-checkbox">
                <input type="checkbox" name="amenity" value="balcon">
                <span>🌅</span> Balcón
            </label>
            <label class="filter-checkbox">
                <input type="checkbox" name="amenity" value="jacuzzi">
                <span>🛁</span> Jacuzzi
            </label>
        </div>
    </div>
    
    <button class="btn-apply-filters">Aplicar filtros</button>
</aside>
```

```css
/* Estilos del Panel de Filtros */
.filters-panel {
    background: var(--color-white);
    border-radius: var(--border-radius);
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-sm);
    position: sticky;
    top: 20px;
}

.filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--color-light-gray);
}

.filters-header h3 {
    font-family: var(--font-heading);
    font-size: var(--font-size-xl);
}

.btn-clear-filters {
    background: none;
    border: none;
    color: var(--color-secondary);
    cursor: pointer;
    font-size: var(--font-size-sm);
}

.filter-group {
    margin-bottom: var(--spacing-lg);
}

.filter-group h4 {
    font-size: var(--font-size-base);
    font-weight: var(--font-semibold);
    margin-bottom: var(--spacing-md);
    color: var(--color-dark-gray);
}

.filter-options {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.filter-checkbox {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    cursor: pointer;
    font-size: var(--font-size-sm);
}

.filter-checkbox input {
    width: 18px;
    height: 18px;
    accent-color: var(--color-secondary);
}

.btn-apply-filters {
    width: 100%;
    background: var(--color-primary);
    color: var(--color-white);
    border: none;
    padding: var(--spacing-md);
    border-radius: var(--border-radius);
    font-weight: var(--font-semibold);
    cursor: pointer;
    transition: background 0.3s;
}

.btn-apply-filters:hover {
    background: var(--color-primary-light);
}
```

#### 3.3 Tarjeta de Habitación

```html
<!-- Tarjeta de Habitación -->
<article class="room-card" data-room-id="1">
    <div class="room-image">
        <img src="../assets/images/rooms/room-1.jpg" alt="Habitación Suite Deluxe">
        <span class="room-badge">Más popular</span>
        <button class="btn-favorite" aria-label="Agregar a favoritos">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
        </button>
    </div>
    
    <div class="room-content">
        <div class="room-header">
            <h3>Suite Deluxe</h3>
            <div class="room-rating">
                <span class="stars">★★★★★</span>
                <span class="reviews">(42 reseñas)</span>
            </div>
        </div>
        
        <div class="room-location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>Piso 3, Vista al mar</span>
        </div>
        
        <div class="room-amenities">
            <span class="amenity" title="WiFi">📶</span>
            <span class="amenity" title="Aire acondicionado">❄️</span>
            <span class="amenity" title="TV">📺</span>
            <span class="amenity" title="Minibar">🍷</span>
            <span class="amenity" title="Balcón">🌅</span>
            <span class="amenity" title="Jacuzzi">🛁</span>
        </div>
        
        <div class="room-capacity">
            <span>👤</span> <span>👤</span>
            <span>Máx. 2 huéspedes</span>
        </div>
        
        <div class="room-description">
            <p>Espaciosa suite con cama king, baño privado con jacuzzi, balcón privado con vista al mar y acceso al lounge ejecutivo.</p>
        </div>
        
        <div class="room-footer">
            <div class="room-price">
                <span class="price-amount">$150</span>
                <span class="price-period">/noche</span>
            </div>
            <div class="room-availability">
                <span class="status available">✅ Disponible</span>
            </div>
        </div>
        
        <div class="room-actions">
            <button class="btn-details" onclick="verDetallesHabitacion(1)">
                Ver detalles
            </button>
            <button class="btn-reserve" onclick="reservarHabitacion(1)">
                Reservar ahora
            </button>
        </div>
    </div>
</article>
```

```css
/* Estilos de Tarjeta de Habitación */
.room-card {
    background: var(--color-white);
    border-radius: var(--border-radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: transform 0.3s, box-shadow 0.3s;
    display: flex;
    flex-direction: column;
}

.room-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-lg);
}

.room-image {
    position: relative;
    height: 220px;
    overflow: hidden;
}

.room-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s;
}

.room-card:hover .room-image img {
    transform: scale(1.05);
}

.room-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    background: var(--color-secondary);
    color: var(--color-white);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: var(--font-size-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
}

.btn-favorite {
    position: absolute;
    top: 12px;
    right: 12px;
    background: var(--color-white);
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s, background 0.2s;
    box-shadow: var(--shadow-sm);
}

.btn-favorite:hover {
    transform: scale(1.1);
    background: var(--color-error);
    color: var(--color-white);
}

.room-content {
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    flex: 1;
}

.room-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-sm);
}

.room-header h3 {
    font-family: var(--font-heading);
    font-size: var(--font-size-xl);
    color: var(--color-primary);
}

.room-rating {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.stars {
    color: var(--color-secondary);
    font-size: var(--font-size-sm);
}

.reviews {
    font-size: var(--font-size-xs);
    color: var(--color-gray);
}

.room-location {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--color-gray);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-md);
}

.room-amenities {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
    flex-wrap: wrap;
}

.amenity {
    font-size: 18px;
    padding: 4px;
    background: var(--color-light-gray);
    border-radius: var(--border-radius-sm);
}

.room-capacity {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-sm);
    color: var(--color-dark-gray);
    margin-bottom: var(--spacing-md);
}

.room-description {
    font-size: var(--font-size-sm);
    color: var(--color-gray);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--spacing-md);
    flex: 1;
}

.room-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-light-gray);
    margin-bottom: var(--spacing-md);
}

.room-price {
    display: flex;
    align-items: baseline;
}

.price-amount {
    font-family: var(--font-heading);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-bold);
    color: var(--color-primary);
}

.price-period {
    font-size: var(--font-size-sm);
    color: var(--color-gray);
    margin-left: 4px;
}

.status.available {
    color: var(--color-success);
    font-size: var(--font-size-sm);
    font-weight: var(--font-medium);
}

.room-actions {
    display: flex;
    gap: var(--spacing-sm);
}

.btn-details,
.btn-reserve {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius);
    font-weight: var(--font-semibold);
    cursor: pointer;
    transition: all 0.3s;
    font-size: var(--font-size-sm);
}

.btn-details {
    background: var(--color-light-gray);
    border: 2px solid var(--color-light-gray);
    color: var(--color-dark-gray);
}

.btn-details:hover {
    background: var(--color-white);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.btn-reserve {
    background: var(--color-secondary);
    border: 2px solid var(--color-secondary);
    color: var(--color-white);
}

.btn-reserve:hover {
    background: var(--color-secondary-dark);
    border-color: var(--color-secondary-dark);
}
```

#### 3.4 Modal de Reserva Rápida

```html
<!-- Modal de Reserva -->
<div class="modal" id="reservationModal">
    <div class="modal-overlay" onclick="cerrarModal()"></div>
    <div class="modal-content">
        <button class="modal-close" onclick="cerrarModal()">×</button>
        
        <div class="modal-header">
            <h2>Reservar Suite Deluxe</h2>
            <p class="modal-subtitle">Complete los datos para confirmar su reserva</p>
        </div>
        
        <form id="reservationForm" class="reservation-form">
            <!-- Datos de la habitación -->
            <div class="room-summary">
                <img src="../assets/images/rooms/room-1-thumb.jpg" alt="Suite Deluxe">
                <div class="summary-details">
                    <h4>Suite Deluxe</h4>
                    <p>📍 Piso 3, Vista al mar</p>
                    <p>👤 Máx. 2 huéspedes</p>
                    <p class="summary-price">$150/noche</p>
                </div>
            </div>
            
            <!-- Fechas -->
            <div class="form-row">
                <div class="form-group">
                    <label for="reservaCheckin">Fecha de entrada *</label>
                    <input type="date" id="reservaCheckin" required>
                </div>
                <div class="form-group">
                    <label for="reservaCheckout">Fecha de salida *</label>
                    <input type="date" id="reservaCheckout" required>
                </div>
            </div>
            
            <!-- Huéspedes -->
            <div class="form-group">
                <label for="reservaGuests">Número de huéspedes *</label>
                <select id="reservaGuests" required>
                    <option value="">Seleccionar</option>
                    <option value="1">1 huésped</option>
                    <option value="2">2 huéspedes</option>
                </select>
            </div>
            
            <!-- Datos del cliente -->
            <div class="form-row">
                <div class="form-group">
                    <label for="reservaNombre">Nombre completo *</label>
                    <input type="text" id="reservaNombre" required>
                </div>
                <div class="form-group">
                    <label for="reservaEmail">Email *</label>
                    <input type="email" id="reservaEmail" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="reservaTelefono">Teléfono *</label>
                    <input type="tel" id="reservaTelefono" required>
                </div>
                <div class="form-group">
                    <label for="reservaDoc">Documento de identidad *</label>
                    <input type="text" id="reservaDoc" required>
                </div>
            </div>
            
            <!-- Solicitudes especiales -->
            <div class="form-group">
                <label for="reservaSolicitudes">Solicitudes especiales</label>
                <textarea id="reservaSolicitudes" rows="3" placeholder="Alergias, preferencias, necesidades especiales..."></textarea>
            </div>
            
            <!-- Resumen de precio -->
            <div class="price-summary">
                <div class="price-line">
                    <span>$150 × 3 noches</span>
                    <span>$450</span>
                </div>
                <div class="price-line">
                    <span>Impuestos (16%)</span>
                    <span>$72</span>
                </div>
                <div class="price-line total">
                    <span>Total</span>
                    <span>$522</span>
                </div>
            </div>
            
            <!-- Términos -->
            <label class="terms-checkbox">
                <input type="checkbox" required>
                <span>Acepto los <a href="#">términos y condiciones</a> y la <a href="#">política de privacidad</a></span>
            </label>
            
            <button type="submit" class="btn-confirm-reservation">
                Confirmar Reserva
            </button>
        </form>
    </div>
</div>
```

---

## 4. Estructura de Página de Servicios

### Layout General (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    HERO SERVICES                                │
│         "Experimenta servicios exclusivos"                     │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NAV SERVICES                                                   │
│  [Todos] [Spa] [Restaurante] [Piscina] [Gimnasio] [ Tours]      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SERVICES GRID                                                  │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │    📷 SPA       │  │  📷 RESTAURANTE │                      │
│  │  Relajación     │  │   Gastronomía   │                      │
│  │  Horario: 8am-8pm│  │  Horario: 7am-11pm│                    │
│  │  [Reservar]     │  │  [Reservar]     │                      │
│  └─────────────────┘  └─────────────────┘                      │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │  📷 PISCINA    │  │  📷 GIMNASIO    │                      │
│  │  Relax          │  │  Fitness        │                      │
│  │  Horario: 6am-10pm│ │  Horario: 24hrs  │                    │
│  │  [Info]         │  │  [Info]         │                      │
│  └─────────────────┘  └─────────────────┘                      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                         FOOTER                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes de la Página de Servicios

#### 4.1 Hero Section de Servicios

```html
<section class="hero-services">
    <div class="hero-overlay"></div>
    <div class="hero-content">
        <h1>Servicios Exclusivos</h1>
        <p class="hero-subtitle">
            Complementa tu experiencia con nuestros servicios de categoría mundial
        </p>
        <div class="hero-stats">
            <div class="stat">
                <span class="stat-number">5+</span>
                <span class="stat-label">Restaurantes</span>
            </div>
            <div class="stat">
                <span class="stat-number">3</span>
                <span class="stat-label">Piscinas</span>
            </div>
            <div class="stat">
                <span class="stat-number">24/7</span>
                <span class="stat-label">Gimnasio</span>
            </div>
            <div class="stat">
                <span class="stat-number">100%</span>
                <span class="stat-label">Satisfacción</span>
            </div>
        </div>
    </div>
</section>
```

```css
/* Hero de Servicios */
.hero-services {
    position: relative;
    height: 400px;
    background-image: url('../assets/images/hero-services.jpg');
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
}

.hero-stats {
    display: flex;
    gap: var(--spacing-xl);
    margin-top: var(--spacing-xl);
    justify-content: center;
}

.stat {
    text-align: center;
    color: var(--color-white);
}

.stat-number {
    display: block;
    font-family: var(--font-heading);
    font-size: var(--font-size-3xl);
    font-weight: var(--font-bold);
    color: var(--color-secondary);
}

.stat-label {
    font-size: var(--font-size-sm);
    opacity: 0.9;
}
```

#### 4.2 Navegación de Servicios

```html
<!-- Navegación por categorías -->
<nav class="services-nav">
    <ul class="services-categories">
        <li>
            <button class="category-btn active" data-category="all">
                <span class="icon">✨</span>
                Todos los servicios
            </button>
        </li>
        <li>
            <button class="category-btn" data-category="spa">
                <span class="icon">💆</span>
                Spa y Wellness
            </button>
        </li>
        <li>
            <button class="category-btn" data-category="restaurante">
                <span class="icon">🍽️</span>
                Restaurantes
            </button>
        </li>
        <li>
            <button class="category-btn" data-category="piscina">
                <span class="icon">🏊</span>
                Piscinas
            </button>
        </li>
        <li>
            <button class="category-btn" data-category="gimnasio">
                <span class="icon">🏋️</span>
                Gimnasio
            </button>
        </li>
        <li>
            <button class="category-btn" data-category="roomservice">
                <span class="icon">🛎️</span>
                Room Service
            </button>
        </li>
        <li>
            <button class="category-btn" data-category="tours">
                <span class="icon">🗺️</span>
                Tours
            </button>
        </li>
    </ul>
</nav>
```

```css
/* Navegación de Servicios */
.services-nav {
    background: var(--color-white);
    padding: var(--spacing-lg) 0;
    border-bottom: 1px solid var(--color-light-gray);
    position: sticky;
    top: 70px;
    z-index: 100;
}

.services-categories {
    display: flex;
    justify-content: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-md);
}

.category-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-lg);
    background: var(--color-light-gray);
    border: 2px solid transparent;
    border-radius: 30px;
    font-size: var(--font-size-sm);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: all 0.3s;
}

.category-btn:hover {
    background: var(--color-white);
    border-color: var(--color-secondary);
}

.category-btn.active {
    background: var(--color-primary);
    color: var(--color-white);
}

.category-btn .icon {
    font-size: 18px;
}
```

#### 4.3 Tarjeta de Servicio

```html
<!-- Tarjeta de Servicio -->
<article class="service-card" data-service-id="1">
    <div class="service-image">
        <img src="../assets/images/services/spa.jpg" alt="Spa Wellness">
        <div class="service-category-badge">Spa y Wellness</div>
    </div>
    
    <div class="service-content">
        <div class="service-header">
            <h3>Spa Wellness</h3>
            <div class="service-rating">
                <span class="stars">★★★★★</span>
                <span>(128 reseñas)</span>
            </div>
        </div>
        
        <p class="service-description">
            Relájate en nuestro spa de clase mundial con tratamientos rejuvenecedores, 
            terapias tradicionales y modernas instalaciones. Incluye sauna, vapor y 
            piscina climatizada.
        </p>
        
        <div class="service-highlights">
            <div class="highlight">
                <span class="highlight-icon">✓</span>
                <span>Masajes terapéuticos</span>
            </div>
            <div class="highlight">
                <span class="highlight-icon">✓</span>
                <span>Tratamientos faciales</span>
            </div>
            <div class="highlight">
                <span class="highlight-icon">✓</span>
                <span>Sauna y vapor</span>
            </div>
        </div>
        
        <div class="service-schedule">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
            </svg>
            <span><strong>Horario:</strong> 8:00 AM - 10:00 PM</span>
        </div>
        
        <div class="service-contact">
            <div class="contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>Ext. 1234</span>
            </div>
            <div class="contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span>spa@hospedaje.com</span>
            </div>
        </div>
        
        <div class="service-actions">
            <button class="btn-service-info" onclick="verInfoServicio(1)">
                Ver información
            </button>
            <button class="btn-service-book" onclick="reservarServicio(1)">
                Reservar cita
            </button>
        </div>
    </div>
</article>
```

```css
/* Estilos de Tarjeta de Servicio */
.service-card {
    background: var(--color-white);
    border-radius: var(--border-radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: transform 0.3s, box-shadow 0.3s;
    display: flex;
    flex-direction: column;
}

.service-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
}

.service-image {
    position: relative;
    height: 250px;
    overflow: hidden;
}

.service-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s;
}

.service-card:hover .service-image img {
    transform: scale(1.05);
}

.service-category-badge {
    position: absolute;
    top: 15px;
    left: 15px;
    background: var(--color-accent);
    color: var(--color-white);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: var(--font-size-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
}

.service-content {
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    flex: 1;
}

.service-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
}

.service-header h3 {
    font-family: var(--font-heading);
    font-size: var(--font-size-xl);
    color: var(--color-primary);
}

.service-rating {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-sm);
}

.service-rating .stars {
    color: var(--color-secondary);
}

.service-description {
    color: var(--color-gray);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--spacing-md);
}

.service-highlights {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
}

.highlight {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--color-dark-gray);
    background: var(--color-light-gray);
    padding: 4px 10px;
    border-radius: 15px;
}

.highlight-icon {
    color: var(--color-success);
    font-weight: var(--font-bold);
}

.service-schedule {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
    color: var(--color-dark-gray);
    margin-bottom: var(--spacing-md);
    padding: var(--spacing-sm);
    background: var(--color-cream);
    border-radius: var(--border-radius);
}

.service-contact {
    display: flex;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-light-gray);
}

.contact-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-sm);
    color: var(--color-gray);
}

.service-actions {
    display: flex;
    gap: var(--spacing-sm);
    margin-top: auto;
}

.btn-service-info,
.btn-service-book {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius);
    font-weight: var(--font-semibold);
    cursor: pointer;
    transition: all 0.3s;
    font-size: var(--font-size-sm);
}

.btn-service-info {
    background: var(--color-white);
    border: 2px solid var(--color-primary);
    color: var(--color-primary);
}

.btn-service-info:hover {
    background: var(--color-primary);
    color: var(--color-white);
}

.btn-service-book {
    background: var(--color-accent);
    border: 2px solid var(--color-accent);
    color: var(--color-white);
}

.btn-service-book:hover {
    background: var(--color-accent-light);
    border-color: var(--color-accent-light);
}
```

#### 4.4 Modal de Reserva de Servicio

```html
<!-- Modal de Reserva de Servicio -->
<div class="modal" id="serviceReservationModal">
    <div class="modal-overlay" onclick="cerrarModalServicio()"></div>
    <div class="modal-content">
        <button class="modal-close" onclick="cerrarModalServicio()">×</button>
        
        <div class="modal-header">
            <span class="service-type-icon">💆</span>
            <h2>Reservar en Spa Wellness</h2>
            <p class="modal-subtitle">Selecciona el tratamiento y horario</p>
        </div>
        
        <form id="serviceReservationForm" class="service-reservation-form">
            <!-- Selección de tratamiento -->
            <div class="form-group">
                <label>Tratamiento *</label>
                <div class="treatment-options">
                    <label class="treatment-option">
                        <input type="radio" name="treatment" value="masaje" checked>
                        <div class="treatment-card">
                            <h4>Masaje Relax</h4>
                            <p>60 min - $80</p>
                        </div>
                    </label>
                    <label class="treatment-option">
                        <input type="radio" name="treatment" value="facial">
                        <div class="treatment-card">
                            <h4>Tratamiento Facial</h4>
                            <p>45 min - $60</p>
                        </div>
                    </label>
                    <label class="treatment-option">
                        <input type="radio" name="treatment" value="spa">
                        <div class="treatment-card">
                            <h4>Día de Spa Completo</h4>
                            <p>180 min - $150</p>
                        </div>
                    </label>
                </div>
            </div>
            
            <!-- Fecha y hora -->
            <div class="form-row">
                <div class="form-group">
                    <label for="serviceDate">Fecha *</label>
                    <input type="date" id="serviceDate" required>
                </div>
                <div class="form-group">
                    <label for="serviceTime">Hora *</label>
                    <select id="serviceTime" required>
                        <option value="">Seleccionar</option>
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                    </select>
                </div>
            </div>
            
            <!-- Número de personas -->
            <div class="form-group">
                <label for="serviceGuests">Número de personas *</label>
                <select id="serviceGuests" required>
                    <option value="1">1 persona</option>
                    <option value="2">2 personas</option>
                    <option value="3">3 personas</option>
                    <option value="4+">4+ personas</option>
                </select>
            </div>
            
            <!-- Datos del cliente -->
            <div class="form-row">
                <div class="form-group">
                    <label for="serviceNombre">Nombre *</label>
                    <input type="text" id="serviceNombre" required>
                </div>
                <div class="form-group">
                    <label for="serviceEmail">Email *</label>
                    <input type="email" id="serviceEmail" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="serviceTelefono">Teléfono *</label>
                <input type="tel" id="serviceTelefono" required>
            </div>
            
            <!-- Solicitudes especiales -->
            <div class="form-group">
                <label for="serviceNotas">Notas o solicitudes especiales</label>
                <textarea id="serviceNotas" rows="3" placeholder="Alergias, preferencias, lesiones..."></textarea>
            </div>
            
            <!-- Información de contacto del servicio -->
            <div class="service-contact-info">
                <p><strong>¿Necesitas ayuda?</strong></p>
                <p>📞 Ext. 1234 | ✉️ spa@hospedaje.com</p>
            </div>
            
            <button type="submit" class="btn-confirm-service">
                Confirmar Reserva
            </button>
        </form>
    </div>
</div>
```

---

## 5. Patrones de Navegación

### 5.1 Estructura del Menú

```html
<!-- Header con navegación -->
<header class="main-header">
    <div class="header-container">
        <a href="index.html" class="logo">
            <img src="../assets/images/logo.svg" alt="Hospedaje Digital">
            <span class="logo-text">Hospedaje Digital</span>
        </a>
        
        <nav class="main-nav">
            <ul class="nav-list">
                <li><a href="index.html">Inicio</a></li>
                <li class="nav-dropdown">
                    <a href="habitaciones.html" class="dropdown-trigger">
                        Habitaciones
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="6,9 12,15 18,9"/>
                        </svg>
                    </a>
                    <ul class="dropdown-menu">
                        <li><a href="habitaciones.html#individual">Individuales</a></li>
                        <li><a href="habitaciones.html#doble">Dobles</a></li>
                        <li><a href="habitaciones.html#suite">Suites</a></li>
                        <li><a href="habitaciones.html#familiar">Familiares</a></li>
                    </ul>
                </li>
                <li class="nav-dropdown">
                    <a href="servicios.html" class="dropdown-trigger">
                        Servicios
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="6,9 12,15 18,9"/>
                        </svg>
                    </a>
                    <ul class="dropdown-menu">
                        <li><a href="servicios.html#spa">Spa</a></li>
                        <li><a href="servicios.html#restaurante">Restaurantes</a></li>
                        <li><a href="servicios.html#piscina">Piscinas</a></li>
                        <li><a href="servicios.html#gimnasio">Gimnasio</a></li>
                    </ul>
                </li>
                <li><a href="nosotros.html">Nosotros</a></li>
                <li><a href="contacto.html">Contacto</a></li>
            </ul>
        </nav>
        
        <div class="header-actions">
            <button class="btn-language" aria-label="Cambiar idioma">
                ES | EN
            </button>
            <a href="tel:+1234567890" class="btn-phone">
                📞 +1 (234) 567-890
            </a>
            <a href="reservar.html" class="btn-book-now">
                Reservar ahora
            </a>
        </div>
        
        <!-- Mobile menu button -->
        <button class="mobile-menu-toggle" aria-label="Abrir menú">
            <span></span>
            <span></span>
            <span></span>
        </button>
    </div>
</header>
```

### 5.2 Breadcrumb (Migas de pan)

```html
<!-- Breadcrumb -->
<nav class="breadcrumb" aria-label="Navegación">
    <ol class="breadcrumb-list">
        <li><a href="index.html">Inicio</a></li>
        <li><a href="habitaciones.html">Habitaciones</a></li>
        <li><a href="habitaciones.html#suite">Suites</a></li>
        <li class="current">Suite Deluxe</li>
    </ol>
</nav>
```

### 5.3 Navegación entre Páginas

```
FLUJO DE NAVEGACIÓN RECOMENDADO:

[index.html] ─────────────────────────────────────────┐
    │                                                │
    ├──→ [habitaciones.html] ──→ [habitacion-detalle.html]
    │         │                         │
    │         └──→ [reservar.html] ◄────┘
    │
    ├──→ [servicios.html] ──→ [servicio-detalle.html]
    │         │
    │         └──→ [reservar-servicio.html] ◄───────┘
    │
    ├──→ [nosotros.html]
    │
    ├──→ [contacto.html]
    │
    └──→ [reservar.html] (Reserva directa)

ELEMENTOS DE CONEXIÓN:
- "Ver servicios" en página de habitaciones
- "Ver habitaciones" en página de servicios  
- CTAs consistentes en ambas páginas
- Footer con enlaces a ambas páginas
```

---

## 6. Diseño Responsive

### Breakpoints Recomendados

```css
/* Breakpoints */
:root {
    /* Móviles pequeños */
    --breakpoint-xs: 320px;
    
    /* Móviles grandes / Tablets pequeñas */
    --breakpoint-sm: 576px;
    
    /* Tablets */
    --breakpoint-md: 768px;
    
    /* Laptops / Escritorios pequeños */
    --breakpoint-lg: 992px;
    
    /* Escritorios grandes */
    --breakpoint-xl: 1200px;
    
    /* Pantallas extra grandes */
    --breakpoint-xxl: 1400px;
}
```

### Adaptaciones Mobile

```css
/* Estilos Mobile First */

/* Móvil (320px+) */
.habitaciones-grid {
    grid-template-columns: 1fr;
}

.filters-panel {
    display: none; /* Se muestra como modal en móvil */
}

.search-bar {
    flex-direction: column;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
    .habitaciones-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Desktop (992px+) */
@media (min-width: 992px) {
    .habitaciones-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .filters-panel {
        display: block;
        width: 280px;
        flex-shrink: 0;
    }
    
    .rooms-content {
        display: flex;
        gap: var(--spacing-xl);
    }
}

/* Large Desktop (1200px+) */
@media (min-width: 1200px) {
    .habitaciones-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}
```

### Menú Mobile

```css
/* Menú Mobile */
.mobile-menu-toggle {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 10px;
}

.mobile-menu-toggle span {
    width: 25px;
    height: 3px;
    background: var(--color-white);
    border-radius: 2px;
    transition: all 0.3s;
}

@media (max-width: 991px) {
    .mobile-menu-toggle {
        display: flex;
    }
    
    .main-nav {
        position: fixed;
        top: 0;
        right: -100%;
        width: 80%;
        max-width: 300px;
        height: 100vh;
        background: var(--color-white);
        padding: var(--spacing-xl);
        transition: right 0.3s;
        z-index: 1000;
    }
    
    .main-nav.active {
        right: 0;
    }
}
```

---

## 7. Accesibilidad (WCAG 2.1)

### Requisitos de Accesibilidad

```html
<!-- Skip Links -->
<a href="#main-content" class="skip-link">Saltar al contenido principal</a>

<!-- ARIA Labels -->
<button aria-label="Cerrar modal" class="modal-close">×</button>

<!-- Form Labels -->
<label for="checkin">Fecha de entrada</label>
<input id="checkin" type="date" aria-required="true">

<!-- Alt Text para imágenes -->
<img src="habitacion.jpg" alt="Habitación Suite Deluxe con cama king y vista al mar">

<!-- Focus States visibles -->
:focus {
    outline: 3px solid var(--color-secondary);
    outline-offset: 2px;
}

<!-- Contraste de colores mínimo 4.5:1 -->
```

### Lista de Verificación de Accesibilidad

| Requisito | Nivel | Descripción |
|-----------|-------|-------------|
| Contraste de texto | AA | Ratio mínimo 4.5:1 para texto normal |
| Contraste de UI | AA | Ratio mínimo 3:1 para elementos gráficos |
| Navegación por teclado | A | Todos los elementos accesibles con Tab |
| Focus visible | A | Indicador de foco visible en todo momento |
| Alt text | A | Descripciones para todas las imágenes |
| Form labels | A | Labels asociados a cada campo |
| Skip links | A | Enlace para saltar navegación |
| Tamaño de objetivo | AA | Mínimo 44x44px para botones táctiles |
| Texto redimensionable | AA | Soporte hasta 200% sin pérdida de funcionalidad |
| Animaciones | A | Opción de reducir movimiento |

---

## 8. Recomendaciones de Usabilidad

### 8.1 Principios UX para Hospitalidad

1. **Anticipación de necesidades**
   - Mostrar disponibilidad en tiempo real
   - Sugerir fechas alternativas si no hay disponibilidad
   - Recordar preferencias del usuario (cookies/localStorage)

2. **Confianza y transparencia**
   - Mostrar precios finales (incluyendo impuestos)
   - Política de cancelación clara
   - Reseñas y valoraciones de otros huéspedes
   - Información de contacto visible

3. **Reducción de fricción**
   - Proceso de reserva en máximo 3 pasos
   - Autocompletado de formularios
   - Guardado de reserva en progreso
   - Confirmación inmediata por email

4. **Contentamiento emocional**
   - Imágenes de alta calidad y realistas
   - Microinteracciones suaves
   - Mensajes personalizados
   - Sorpresas positivas (upgrades, amenities)

### 8.2 Patrones de Conversión

```
ELEMENTOS QUE AUMENTAN CONVERSIÓN:

1. ✅ Urgencia limitada
   - "Solo quedan 2 habitaciones"
   - "Precio especial por tiempo limitado"

2. ✅ Social proof
   - Reseñas con fotos reales
   - "X huéspedes han reservado hoy"
   - Certificados de confianza

3. ✅ Garantías
   - "Cancelación gratuita hasta 24h antes"
   - "Mejor precio garantizado"

4. ✅ CTAs claros y prominentes
   - Botones grandes y color contrastado
   - Texto directo: "Reservar ahora"
   - Posición estratégica

5. ✅ Simplificación
   - Un campo de búsqueda principal
   - Formularios cortos
   - Progress indicator en reservas
```

### 8.3 Errores Comunes a Evitar

| Error | Problema | Solución |
|-------|----------|----------|
| Formularios muy largos | Abandono | Solo pedir información esencial |
| Sin disponibilidad visible | Frustración | Mostrar calendario con fechas disponibles |
| Precios ocultos | Desconfianza | Mostrar precio total desde el inicio |
| Proceso de reserva largo | Abandono | Máximo 3 pasos |
| Imágenes de baja calidad | Desinterés | Fotografías profesionales de alta resolución |
| Sin contacto visible | Desconfianza | Teléfono y email prominentemente visibles |

---

## 9. Animaciones y Microinteracciones

### Transiciones Recomendadas

```css
/* Transiciones suaves */
:root {
    --transition-fast: 150ms ease;
    --transition-normal: 300ms ease;
    --transition-slow: 500ms ease;
}

/* Hover en tarjetas */
.room-card,
.service-card {
    transition: transform var(--transition-normal), 
                box-shadow var(--transition-normal);
}

/* Botones */
.btn-reserve {
    transition: background var(--transition-fast), 
                transform var(--transition-fast);
}

/* Loading states */
.skeleton {
    background: linear-gradient(90deg, 
        var(--color-light-gray) 25%, 
        var(--color-cream) 50%, 
        var(--color-light-gray) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Fade in para contenido */
.fade-in {
    animation: fadeIn var(--transition-slow) forwards;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
```

---

## 10. Estructura de Archivos Recomendada

```
📁 mi-proyecto-frontend/
│
├── 📁 pages/
│   ├── index.html              (Página principal)
│   ├── habitaciones.html       (Catálogo de habitaciones)
│   ├── habitacion-detalle.html (Detalle de habitación)
│   ├── servicios.html          (Catálogo de servicios)
│   ├── servicio-detalle.html  (Detalle de servicio)
│   ├── reservar.html          (Página de reserva)
│   ├── nosotros.html           (Sobre nosotros)
│   └── contacto.html          (Formulario de contacto)
│
├── 📁 css/
│   ├── reset.css               (Reset de estilos)
│   ├── variables.css           (Variables CSS)
│   ├── base.css               (Estilos base)
│   ├── components.css         (Componentes reutilizables)
│   ├── layout.css             (Layout y grid)
│   ├── pages.css              (Estilos específicos de páginas)
│   └── animations.css         (Animaciones)
│
├── 📁 js/
│   ├── api.js                 (Conexión con backend)
│   ├── app.js                 (Lógica principal)
│   ├── habitaciones.js        (Funciones de habitaciones)
│   ├── servicios.js           (Funciones de servicios)
│   ├── reservas.js           (Lógica de reservas)
│   ├── ui.js                 (Componentes UI)
│   └── utils.js              (Utilidades)
│
├── 📁 assets/
│   ├── 📁 images/
│   │   ├── 📁 rooms/         (Imágenes de habitaciones)
│   │   ├── 📁 services/     (Imágenes de servicios)
│   │   ├── 📁 common/       (Imágenes comunes, logo, etc.)
│   │   └── 📁 hero/         (Imágenes hero)
│   ├── 📁 icons/            (Iconos SVG)
│   └── 📁 fonts/            (Fuentes personalizadas)
│
└── 📁 components/
    ├── header.html          (Componente header)
    ├── footer.html          (Componente footer)
    ├── modal.html           (Template de modal)
    ├── room-card.html       (Template de tarjeta de habitación)
    └── service-card.html    (Template de tarjeta de servicio)
```

---

## Resumen de Elementos Clave

### Página de Habitaciones

| Elemento | Propósito |
|----------|-----------|
| Hero con búsqueda | Primera interacción, captura fechas |
| Panel de filtros | Refinamiento de resultados |
| Tarjetas de habitación | Presentación visual de opciones |
| Modal de reserva | Conversión directa |
| Estados de disponibilidad | Transparencia |

### Página de Servicios

| Elemento | Propósito |
|----------|-----------|
| Hero emocional | Inspiración y deseo |
| Navegación por categoría | Facilidad de exploración |
| Tarjetas de servicio | Información detallada |
| Información de contacto | Facilitar comunicación |
| Reserva de citas | Conversión |

### Navegación Entre Páginas

- **De habitaciones a servicios**: Banner o botón "Experimenta nuestros servicios"
- **De servicios a habitaciones**: "Recibe un descanso exclusivo en nuestras habitaciones"
- **Footer**: Enlaces cruzados
- **CTAs**: Consistencia en ambos sentidos

---

## Próximos Pasos Recomendados

1. **Implementar estructura HTML** de las páginas principales
2. **Crear estilos CSS** base con las variables proporcionadas
3. **Desarrollar componentes** (cards, modals, filtros)
4. **Integrar con API** existente del backend
5. **Añadir interacciones** y animaciones
6. **Probar responsive** en diferentes dispositivos
7. **Verificar accesibilidad** y corregir issues
8. **Optimizar rendimiento** (imágenes, carga diferida)

---

*Documento creado para Hospedaje Digital - Guía de Diseño Frontend*
