/* ==========================================================================
   ANTITESI PIZZERIA - JavaScript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    Preloader.init();
    Navbar.init();
    MobileMenu.init();
    SmoothScroll.init();
    MenuTabs.init();
    ScrollReveal.init();
    Gallery.init();
    MobileCta.init();
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
   Menu Tabs
   -------------------------------------------------------------------------- */
const MenuTabs = {
    tabs: null,
    categories: null,

    init() {
        this.tabs = document.querySelectorAll('.menu-tab');
        this.categories = document.querySelectorAll('.menu-category');

        if (!this.tabs.length || !this.categories.length) return;

        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab));
        });
    },

    switchTab(clickedTab) {
        const category = clickedTab.dataset.category;

        // Update active tab
        this.tabs.forEach(tab => tab.classList.remove('active'));
        clickedTab.classList.add('active');

        // Update active category
        this.categories.forEach(cat => {
            cat.classList.remove('active');
            if (cat.id === category) {
                cat.classList.add('active');
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
            '.gallery-item',
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

    init() {
        this.items = document.querySelectorAll('.gallery-item');
        if (!this.items.length) return;

        // Add hover effect enhancement
        this.items.forEach(item => {
            item.addEventListener('mouseenter', () => this.handleHover(item, true));
            item.addEventListener('mouseleave', () => this.handleHover(item, false));
        });
    },

    handleHover(item, isHovering) {
        // Optional: Add more complex hover effects here
        // For now, CSS handles the hover states
    }
};

/* --------------------------------------------------------------------------
   Mobile Sticky CTA - Appare dopo scroll oltre la hero
   -------------------------------------------------------------------------- */
const MobileCta = {
    cta: null,
    heroHeight: 0,

    init() {
        this.cta = document.getElementById('mobileCta');
        if (!this.cta) return;

        const hero = document.getElementById('hero');
        if (hero) {
            this.heroHeight = hero.offsetHeight;
        }

        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    },

    handleScroll() {
        if (window.scrollY > this.heroHeight * 0.8) {
            this.cta.classList.add('visible');
        } else {
            this.cta.classList.remove('visible');
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
