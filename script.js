document.addEventListener('DOMContentLoaded', () => {
    // --- AUTO-SCANNING PORTFOLIO LOGIC ---
    // This script scans the assets folder for images named portfolio-1, portfolio-2, etc.
    // It checks .jpg, .png, and .jpeg extensions automatically.
    const initPortfolioCarousel = async () => {
        const carouselInner = document.getElementById('carousel-inner');
        const carouselDots = document.getElementById('carousel-dots');
        if (!carouselInner || !carouselDots) return;

        const extensions = ['jpg', 'png', 'jpeg', 'webp'];
        const detectedImages = [];
        let index = 1;
        let consecutiveFailures = 0;

        // Scan until we hit a gap or a limit (safety cap of 50)
        while (index <= 50) {
            let found = false;
            for (const ext of extensions) {
                const url = `assets/portfolio-${index}.${ext}`;
                try {
                    // We use a HEAD request check if the file exists without downloading it fully yet
                    const response = await fetch(url, { method: 'HEAD' });
                    if (response.ok) {
                        detectedImages.push({ src: url, alt: `Portfolio Piece ${index}` });
                        found = true;
                        break; // Found the file, move to next index
                    }
                } catch (e) {
                    // Fetch failed (common if file is missing)
                }
            }

            if (found) {
                consecutiveFailures = 0;
            } else {
                consecutiveFailures++;
            }

            // If we miss 2 numbers in a row, assume we've reached the end of the list
            if (consecutiveFailures >= 2) break;
            index++;
        }

        // If no images found, show a fallback or just clear
        if (detectedImages.length === 0) {
            carouselInner.innerHTML = '<p style="padding: 2rem; text-align: center;">Add images to assets/ named portfolio-1.jpg to see them here!</p>';
            return;
        }

        // Render the detected images
        carouselInner.innerHTML = '';
        carouselDots.innerHTML = '';
        
        detectedImages.forEach((item, i) => {
            const carouselItem = document.createElement('div');
            carouselItem.className = `carousel-item${i === 0 ? ' active' : ''}`;
            carouselItem.innerHTML = `<img src="${item.src}" alt="${item.alt}" loading="lazy">`;
            carouselInner.appendChild(carouselItem);

            const dot = document.createElement('span');
            dot.className = `dot${i === 0 ? ' active' : ''}`;
            dot.setAttribute('data-index', i);
            carouselDots.appendChild(dot);
            dot.addEventListener('click', () => showSlide(i));
        });

        const items = carouselInner.querySelectorAll('.carousel-item');
        const dots = carouselDots.querySelectorAll('.dot');
        const prevBtn = document.querySelector('.carousel-control.prev');
        const nextBtn = document.querySelector('.carousel-control.next');
        let currentIndex = 0;

        function showSlide(idx) {
            if (idx < 0) currentIndex = items.length - 1;
            else if (idx >= items.length) currentIndex = 0;
            else currentIndex = idx;

            carouselInner.style.transform = `translateX(${-currentIndex * 100}%)`;
            dots.forEach((dot, dIdx) => dot.classList.toggle('active', dIdx === currentIndex));
        }

        if (prevBtn) prevBtn.addEventListener('click', () => showSlide(currentIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => showSlide(currentIndex + 1));

        // Mobile Swipe Support
        let touchStartX = 0;
        carouselInner.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, { passive: true });
        carouselInner.addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) showSlide(currentIndex + 1);
            else if (touchEndX - touchStartX > 50) showSlide(currentIndex - 1);
        }, { passive: true });
    };

    initPortfolioCarousel();

    // Dark Mode Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const currentTheme = savedTheme || systemTheme;

    // Apply initial theme
    htmlElement.setAttribute('data-theme', currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = htmlElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Intersection Observer for Scroll Reveals
    const revealOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Trigger only once
            }
        });
    }, revealOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => revealObserver.observe(el));
});
