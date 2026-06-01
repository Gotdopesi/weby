document.addEventListener('DOMContentLoaded', () => {
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    const closeBtn = document.getElementById('lightbox-close');

    let currentIndex = 0;

    if (galleryItems.length && lightbox && lightboxImg) {
        // Open lightbox
        galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                currentIndex = index;
                showImage(currentIndex);
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent scrolling when open
            });
        });

        // Show image by index
        function showImage(index) {
            const fullSrc = galleryItems[index].getAttribute('data-src');
            lightboxImg.src = fullSrc;
        }

        // Close lightbox
        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => {
                lightboxImg.src = '';
            }, 300);
        }

        closeBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            closeLightbox();
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target === lightboxImg) {
                closeLightbox();
            }
        });

        // Navigation
        function showPrev(e) {
            e?.stopPropagation();
            currentIndex = (currentIndex > 0) ? currentIndex - 1 : galleryItems.length - 1;
            showImage(currentIndex);
        }

        function showNext(e) {
            e?.stopPropagation();
            currentIndex = (currentIndex < galleryItems.length - 1) ? currentIndex + 1 : 0;
            showImage(currentIndex);
        }

        prevBtn?.addEventListener('click', showPrev);
        nextBtn?.addEventListener('click', showNext);

        // Keyboard Support
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'ArrowLeft') showPrev();
            if (e.key === 'ArrowRight') showNext();
            if (e.key === 'Escape') closeLightbox();
        });

        // Swipe Support
        let touchStartX = 0;
        let touchEndX = 0;

        lightbox.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);

        lightbox.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, false);

        function handleSwipe() {
            const threshold = 50;
            if (touchEndX < touchStartX - threshold) showNext();
            if (touchEndX > touchStartX + threshold) showPrev();
        }
    }
});
