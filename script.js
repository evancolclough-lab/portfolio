document.addEventListener('DOMContentLoaded', () => {
    // --- AUTO-SCANNING PORTFOLIO LOGIC ---
    // This script scans the assets folder for images named portfolio-1, portfolio-2, etc.
    // It checks .jpg, .png, and .jpeg extensions automatically.
    const initPortfolioCarousel = async () => {
        const carouselInner = document.getElementById('carousel-inner');
        const carouselDots = document.getElementById('carousel-dots');
        if (!carouselInner || !carouselDots) return;

        const extensions = ['jpg', 'png', 'jpeg', 'webp'];

        // Checks each extension for a given base filename (no extension) and
        // returns the first URL that actually exists, or null.
        const findVariant = async (base) => {
            for (const ext of extensions) {
                const url = `assets/${base}.${ext}`;
                try {
                    const response = await fetch(url);
                    if (response.ok) return url;
                } catch (e) {
                    // Fetch failed (common if file is missing)
                }
            }
            return null;
        };

        // Each entry is either a single image ({ type: 'image', src, alt }) or
        // a grouped multi-image post ({ type: 'group', images: [...] }), detected
        // via the assets/portfolio-N-1, portfolio-N-2, ... naming convention.
        const detectedItems = [];
        let index = 1;
        let consecutiveFailures = 0;

        // Scan until we hit a gap or a limit (safety cap of 50)
        while (index <= 50) {
            const single = await findVariant(`portfolio-${index}`);

            if (single) {
                detectedItems.push({ type: 'image', src: single, alt: `Portfolio Piece ${index}` });
                consecutiveFailures = 0;
                index++;
                continue;
            }

            // No standalone image at this position — check for a grouped post.
            const groupImages = [];
            let sub = 1;
            while (sub <= 10) {
                const groupSrc = await findVariant(`portfolio-${index}-${sub}`);
                if (!groupSrc) break;
                groupImages.push({ src: groupSrc, alt: `Portfolio Piece ${index}, image ${sub}` });
                sub++;
            }

            if (groupImages.length > 0) {
                detectedItems.push({ type: 'group', images: groupImages });
                consecutiveFailures = 0;
            } else {
                consecutiveFailures++;
            }

            // If we miss 2 numbers in a row, assume we've reached the end of the list
            if (consecutiveFailures >= 2) break;
            index++;
        }

        // If no images found, show a fallback or just clear
        if (detectedItems.length === 0) {
            carouselInner.innerHTML = '<p style="padding: 2rem; text-align: center;">Add images to assets/ named portfolio-1.jpg to see them here!</p>';
            return;
        }

        // Render the detected items
        carouselInner.innerHTML = '';
        carouselDots.innerHTML = '';

        detectedItems.forEach((item, i) => {
            const carouselItem = document.createElement('div');
            carouselItem.className = `carousel-item${i === 0 ? ' active' : ''}`;

            if (item.type === 'group') {
                carouselItem.classList.add('carousel-item-group');
                const slides = item.images.map((img, subIdx) =>
                    `<img src="${img.src}" alt="${img.alt}" loading="lazy" class="post-slide${subIdx === 0 ? ' active' : ''}">`
                ).join('');
                const postDots = item.images.map((_, subIdx) =>
                    `<span class="post-dot${subIdx === 0 ? ' active' : ''}" data-sub-index="${subIdx}"></span>`
                ).join('');
                carouselItem.innerHTML = `
                    <div class="post-stage">
                        ${slides}
                        <div class="post-nav">
                            <button type="button" class="post-arrow post-prev" aria-label="Previous image in post">&lsaquo;</button>
                            <div class="post-dots">${postDots}</div>
                            <button type="button" class="post-arrow post-next" aria-label="Next image in post">&rsaquo;</button>
                        </div>
                    </div>
                `;
            } else {
                carouselItem.innerHTML = `<img src="${item.src}" alt="${item.alt}" loading="lazy">`;
            }

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
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxClose = document.getElementById('lightbox-close');
        
        let currentIndex = 0;

        // --- LIGHTBOX LOGIC ---
        function openLightbox(src, alt) {
            lightboxImg.src = src;
            lightboxImg.alt = alt;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden'; // Stop scrolling
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = ''; // Resume scrolling
        }

        // Add clicks to images (and wire up nested nav for grouped posts)
        items.forEach(item => {
            if (item.classList.contains('carousel-item-group')) {
                const slides = Array.from(item.querySelectorAll('.post-slide'));
                const postDots = Array.from(item.querySelectorAll('.post-dot'));
                const postPrev = item.querySelector('.post-prev');
                const postNext = item.querySelector('.post-next');
                let subIndex = 0;

                function showSub(newSubIndex) {
                    if (newSubIndex < 0) newSubIndex = slides.length - 1;
                    else if (newSubIndex >= slides.length) newSubIndex = 0;
                    subIndex = newSubIndex;
                    slides.forEach((s, i) => s.classList.toggle('active', i === subIndex));
                    postDots.forEach((d, i) => d.classList.toggle('active', i === subIndex));
                }

                if (postPrev) postPrev.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showSub(subIndex - 1);
                });
                if (postNext) postNext.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showSub(subIndex + 1);
                });
                postDots.forEach((d, i) => d.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showSub(i);
                }));

                slides.forEach(img => {
                    img.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openLightbox(img.src, img.alt);
                    });
                });
            } else {
                const img = item.querySelector('img');
                img.addEventListener('click', () => openLightbox(img.src, img.alt));
            }
        });

        // Close logic
        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox || e.target === lightboxImg) closeLightbox();
            });
        }

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeLightbox();
        });

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

    // Nav Scrollspy
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('section[id]');
    const navCurrentSection = document.getElementById('nav-current-section');
    const sectionLabels = {
        experience: 'Experience',
        education: 'Education',
        skills: 'Skills',
        portfolio: 'Work',
        contact: 'Contact'
    };

    if (navLinks.length && sections.length) {
        let activeId = null;

        const spyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.getAttribute('id');
                if (entry.isIntersecting) {
                    activeId = id;
                } else if (activeId === id) {
                    activeId = null;
                }
            });

            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
            });
            if (navCurrentSection) {
                navCurrentSection.textContent = sectionLabels[activeId] || '';
                navCurrentSection.classList.toggle('visible', Boolean(sectionLabels[activeId]));
            }
        }, { rootMargin: '-45% 0px -45% 0px' });

        sections.forEach(section => spyObserver.observe(section));
    }

    // Hero Image Tilt (desktop only)
    const tiltFrame = document.getElementById('tilt-frame');
    if (tiltFrame && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const strength = 8;
        tiltFrame.addEventListener('mousemove', (e) => {
            const rect = tiltFrame.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            tiltFrame.style.transform = `rotateY(${x * strength}deg) rotateX(${-y * strength}deg)`;
        });
        tiltFrame.addEventListener('mouseleave', () => {
            tiltFrame.style.transform = 'rotateY(0deg) rotateX(0deg)';
        });
    }
});
