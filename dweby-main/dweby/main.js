/**
 * Základní globální skripty pro web Dominik Bašek
 */

const GA_ID = 'G-NR23E6CLX9';

// Google Analytics Loader
function loadGA() {
    // Pokud už skript existuje, znovu nenačítat
    if (document.querySelector(`script[src*="${GA_ID}"]`)) return;

    var script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);
    
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', GA_ID);
    console.log('GA4 Initialized');
}

// Funkce pro zpracování souhlasu (voláno z HTML)
window.setCookieConsent = function(consent) {
    localStorage.setItem('cookieConsent', consent);
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.classList.remove('show');
    
    if (consent === 'accepted') {
        loadGA();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Kontrola souhlasu
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
        const banner = document.getElementById('cookieBanner');
        if (banner) banner.classList.add('show');
    } else if (consent === 'accepted') {
        loadGA();
    }

    // Nastavení aktuálního roku v patičce
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Logika mobilního menu (Hamburger)
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Zavřít menu při kliknutí mimo
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && e.target !== navToggle) {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });

        // Zavřít menu při kliknutí na odkaz
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
});
