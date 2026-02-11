/* ==========================================================================
   ANTITESI PIZZERIA - JavaScript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    Preloader.init();
    Navbar.init();
    MobileMenu.init();
    SmoothScroll.init();
    DynamicMenu.init();
    ScrollReveal.init();
    Gallery.init();
    StickyCta.init();
});

/* --------------------------------------------------------------------------
   Preloader
   -------------------------------------------------------------------------- */
const Preloader = {
    init() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        // Hide preloader when page is fully loaded
        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.classList.add('loaded');
                document.body.style.overflow = '';
            }, 500);
        });

        // Prevent scroll while loading
        document.body.style.overflow = 'hidden';
    }
};

/* --------------------------------------------------------------------------
   Navbar
   -------------------------------------------------------------------------- */
const Navbar = {
    navbar: null,
    scrollThreshold: 100,

    init() {
        this.navbar = document.getElementById('navbar');
        if (!this.navbar) return;

        this.handleScroll();
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    },

    handleScroll() {
        const scrollY = window.scrollY;

        if (scrollY > this.scrollThreshold) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }
    }
};

/* --------------------------------------------------------------------------
   Mobile Menu
   -------------------------------------------------------------------------- */
const MobileMenu = {
    toggle: null,
    menu: null,
    links: null,
    isOpen: false,

    init() {
        this.toggle = document.querySelector('.nav-toggle');
        this.menu = document.querySelector('.nav-menu');
        this.links = document.querySelectorAll('.nav-link');

        if (!this.toggle || !this.menu) return;

        this.toggle.addEventListener('click', () => this.toggleMenu());

        // Close menu when clicking a link
        this.links.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.menu.contains(e.target) && !this.toggle.contains(e.target)) {
                this.closeMenu();
            }
        });
    },

    toggleMenu() {
        this.isOpen = !this.isOpen;
        this.toggle.classList.toggle('active');
        this.menu.classList.toggle('active');
        document.body.style.overflow = this.isOpen ? 'hidden' : '';
    },

    closeMenu() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.toggle.classList.remove('active');
        this.menu.classList.remove('active');
        document.body.style.overflow = '';
    }
};

/* --------------------------------------------------------------------------
   Smooth Scroll
   -------------------------------------------------------------------------- */
const SmoothScroll = {
    init() {
        const links = document.querySelectorAll('a[href^="#"]');

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#') return;

                const target = document.querySelector(href);
                if (!target) return;

                e.preventDefault();

                const navbarHeight = document.getElementById('navbar')?.offsetHeight || 0;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            });
        });
    }
};

/* --------------------------------------------------------------------------
   Dynamic Menu — Carica il menù da menu.json
   -------------------------------------------------------------------------- */
const DynamicMenu = {
    container: null,
    tabsContainer: null,

    async init() {
        this.container = document.querySelector('.menu-content');
        this.tabsContainer = document.querySelector('.menu-tabs');
        if (!this.container || !this.tabsContainer) return;

        try {
            const resp = await fetch('menu.json');
            const data = await resp.json();
            this.render(data);
        } catch (e) {
            console.error('Errore caricamento menu:', e);
        }
    },

    render(data) {
        this.tabsContainer.innerHTML = '';
        this.container.innerHTML = '';

        data.categorie.forEach((cat, i) => {
            // Tab
            const btn = document.createElement('button');
            btn.className = 'menu-tab' + (i === 0 ? ' active' : '');
            btn.dataset.category = cat.id;
            btn.textContent = cat.nome;
            btn.addEventListener('click', () => this.switchTab(btn));
            this.tabsContainer.appendChild(btn);

            // Category content
            const section = document.createElement('div');
            section.className = 'menu-category' + (i === 0 ? ' active' : '');
            section.id = cat.id;

            const grid = document.createElement('div');
            grid.className = 'menu-grid';

            cat.piatti.forEach(piatto => {
                grid.appendChild(this.createItem(piatto));
            });

            section.appendChild(grid);

            // Nota a fondo categoria
            if (cat.nota) {
                const nota = document.createElement('p');
                nota.className = 'menu-category-nota';
                nota.textContent = cat.nota;
                section.appendChild(nota);
            }

            this.container.appendChild(section);
        });

        // Attiva animazioni scroll sui nuovi elementi
        this.addRevealAnimations();
    },

    createItem(piatto) {
        const article = document.createElement('article');
        article.className = 'menu-item';

        let html = '';

        if (piatto.immagine) {
            html += `<div class="menu-item-image">
                <img src="assets/images/menu/${piatto.immagine}" alt="${piatto.nome}" loading="lazy">
            </div>`;
        }

        const prezzoDisplay = piatto.nota_prezzo || `&euro;${piatto.prezzo}`;

        html += `<div class="menu-item-content">
            <div class="menu-item-header">
                <h3>${piatto.nome}</h3>
                <span class="menu-item-price">${prezzoDisplay}</span>
            </div>`;

        if (piatto.descrizione) {
            html += `<p class="menu-item-desc">${piatto.descrizione}</p>`;
        }

        if (piatto.badge && piatto.badge.length) {
            piatto.badge.forEach(b => {
                let cls = 'menu-item-badge';
                if (b === 'Piccante') cls += ' menu-item-badge--spicy';
                if (b === 'Premiato') cls += ' menu-item-badge--signature';
                html += `<span class="${cls}">${b}</span>`;
            });
        }

        html += '</div>';
        article.innerHTML = html;
        return article;
    },

    switchTab(clickedTab) {
        const category = clickedTab.dataset.category;
        document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
        clickedTab.classList.add('active');
        document.querySelectorAll('.menu-category').forEach(cat => {
            cat.classList.remove('active');
            if (cat.id === category) cat.classList.add('active');
        });
    },

    addRevealAnimations() {
        document.querySelectorAll('.menu-item').forEach((el, index) => {
            el.classList.add('reveal');
            el.style.transitionDelay = `${index * 0.1}s`;
            if (ScrollReveal.observer) {
                ScrollReveal.observer.observe(el);
            }
        });
    }
};

/* --------------------------------------------------------------------------
   Scroll Reveal Animations
   -------------------------------------------------------------------------- */
const ScrollReveal = {
    elements: null,
    observer: null,

    init() {
        // Add reveal class to elements we want to animate
        this.addRevealClass();

        this.elements = document.querySelectorAll('.reveal');
        if (!this.elements.length) return;

        // Use Intersection Observer for performance
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            }
        );

        this.elements.forEach(el => this.observer.observe(el));
    },

    addRevealClass() {
        // Sections to animate
        const selectors = [
            '.section-header',
            '.filosofia-content > *',
            '.menu-item',
            '.pizza-feature',
            '.pizza-image',
            '.prenota-info',
            '.prenota-cta',
            '.contatti-item',
            '.contatti-map'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach((el, index) => {
                el.classList.add('reveal');
                el.style.transitionDelay = `${index * 0.1}s`;
            });
        });
    },

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optionally unobserve after animation
                // this.observer.unobserve(entry.target);
            }
        });
    }
};

/* --------------------------------------------------------------------------
   Gallery Lightbox (Simple Implementation)
   -------------------------------------------------------------------------- */
const Gallery = {
    items: null,
    container: null,
    dots: null,
    autoScrollTimer: null,
    currentIndex: 0,
    isMobile: false,

    init() {
        this.container = document.querySelector('.gallery');
        this.items = document.querySelectorAll('.gallery-item');
        this.dots = document.querySelector('.gallery-dots');
        if (!this.items.length) return;

        // Hover effects (desktop)
        this.items.forEach(item => {
            item.addEventListener('mouseenter', () => this.handleHover(item, true));
            item.addEventListener('mouseleave', () => this.handleHover(item, false));
        });

        // Mobile carousel
        this.checkMobile();
        window.addEventListener('resize', () => this.checkMobile());
    },

    checkMobile() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;

        if (this.isMobile && !wasMobile) {
            this.initCarousel();
        } else if (!this.isMobile && wasMobile) {
            this.destroyCarousel();
        }
    },

    initCarousel() {
        if (!this.container || !this.dots) return;

        // Crea dots
        this.dots.innerHTML = '';
        this.items.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Foto ' + (i + 1));
            dot.addEventListener('click', () => this.goTo(i));
            this.dots.appendChild(dot);
        });

        // Scroll listener per aggiornare dots
        this.container.addEventListener('scroll', () => this.onScroll());

        // Auto-scroll ogni 3.5s
        this.startAutoScroll();

        // Pausa auto-scroll su touch
        this.container.addEventListener('touchstart', () => this.stopAutoScroll(), { passive: true });
        this.container.addEventListener('touchend', () => this.startAutoScroll(), { passive: true });
    },

    destroyCarousel() {
        this.stopAutoScroll();
        if (this.dots) this.dots.innerHTML = '';
    },

    onScroll() {
        if (!this.container) return;
        const scrollLeft = this.container.scrollLeft;
        const itemWidth = this.container.offsetWidth * 0.85 + 12; // 85% + gap
        const index = Math.round(scrollLeft / itemWidth);
        if (index !== this.currentIndex) {
            this.currentIndex = index;
            this.updateDots();
        }
    },

    updateDots() {
        if (!this.dots) return;
        const allDots = this.dots.querySelectorAll('.gallery-dot');
        allDots.forEach((d, i) => d.classList.toggle('active', i === this.currentIndex));
    },

    goTo(index) {
        if (!this.container) return;
        const itemWidth = this.container.offsetWidth * 0.85 + 12;
        this.container.scrollTo({ left: index * itemWidth, behavior: 'smooth' });
        this.currentIndex = index;
        this.updateDots();
    },

    startAutoScroll() {
        this.stopAutoScroll();
        this.autoScrollTimer = setInterval(() => {
            const next = (this.currentIndex + 1) % this.items.length;
            this.goTo(next);
        }, 3500);
    },

    stopAutoScroll() {
        if (this.autoScrollTimer) {
            clearInterval(this.autoScrollTimer);
            this.autoScrollTimer = null;
        }
    },

    handleHover(item, isHovering) {
        // CSS handles hover states
    }
};

/* --------------------------------------------------------------------------
   Sticky CTA - Appare dopo scroll oltre la hero (mobile + desktop)
   -------------------------------------------------------------------------- */
const StickyCta = {
    mobileCta: null,
    desktopCta: null,
    heroHeight: 0,

    init() {
        this.mobileCta = document.getElementById('mobileCta');
        this.desktopCta = document.getElementById('desktopCta');
        if (!this.mobileCta && !this.desktopCta) return;

        const hero = document.getElementById('hero');
        if (hero) {
            this.heroHeight = hero.offsetHeight;
        }

        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    },

    handleScroll() {
        const show = window.scrollY > this.heroHeight * 0.8;
        if (this.mobileCta) {
            this.mobileCta.classList.toggle('visible', show);
        }
        if (this.desktopCta) {
            this.desktopCta.classList.toggle('visible', show);
        }
    }
};

/* --------------------------------------------------------------------------
   Utility Functions
   -------------------------------------------------------------------------- */
const Utils = {
    // Debounce function for scroll/resize events
    debounce(func, wait = 100) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for scroll events
    throttle(func, limit = 100) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

/* --------------------------------------------------------------------------
   Performance: Lazy Loading Images
   -------------------------------------------------------------------------- */
const LazyLoad = {
    init() {
        if ('loading' in HTMLImageElement.prototype) {
            // Browser supports native lazy loading
            const images = document.querySelectorAll('img[loading="lazy"]');
            images.forEach(img => {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                }
            });
        } else {
            // Fallback to Intersection Observer
            const images = document.querySelectorAll('img[loading="lazy"]');
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                        }
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }
    }
};

// Initialize lazy loading
LazyLoad.init();

/* --------------------------------------------------------------------------
   Google Rating - Aggiornamento dinamico da Google Places API
   -------------------------------------------------------------------------- */
const GoogleRating = {
    // Place ID di Antitesi Pizzeria (da Google Maps)
    PLACE_ID: 'ChIJK4m-SrRkLxMRCZkE1JbIYEg',
    // API Key Google (impostare per abilitare aggiornamento automatico)
    API_KEY: '',

    init() {
        if (!this.API_KEY) return;

        const el = document.getElementById('google-rating');
        if (!el) return;

        this.fetchRating(el);
    },

    async fetchRating(el) {
        try {
            const url = `https://places.googleapis.com/v1/places/${this.PLACE_ID}?fields=rating,userRatingCount&key=${this.API_KEY}`;
            const resp = await fetch(url, {
                headers: { 'X-Goog-FieldMask': 'rating,userRatingCount' }
            });
            if (!resp.ok) return;

            const data = await resp.json();
            if (data.rating) {
                el.textContent = data.rating.toFixed(1);
                // Aggiorna anche structured data
                const schema = document.querySelector('script[type="application/ld+json"]');
                if (schema) {
                    try {
                        const sd = JSON.parse(schema.textContent);
                        sd.aggregateRating.ratingValue = data.rating.toFixed(1);
                        if (data.userRatingCount) {
                            sd.aggregateRating.reviewCount = String(data.userRatingCount);
                        }
                        schema.textContent = JSON.stringify(sd, null, 4);
                    } catch(e) {}
                }
            }
        } catch(e) {
            // Silenzioso: mantiene il valore hardcoded
        }
    }
};

GoogleRating.init();
