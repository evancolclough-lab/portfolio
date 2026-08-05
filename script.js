document.addEventListener('DOMContentLoaded', () => {
    // --- AUTO-SCANNING PORTFOLIO LOGIC ---
    // This script scans the assets folder for images named portfolio-1, portfolio-2, etc.
    // It checks .jpg, .png, .jpeg, and .webp extensions automatically.
    const initPortfolioGrid = async () => {
        const grid = document.getElementById('portfolio-grid');
        if (!grid) return;

        const extensions = ['jpg', 'png', 'jpeg', 'webp'];
        const MAX_INDEX = 50;
        const MAX_GROUP_SIZE = 10;
        const BATCH_SIZE = 6;

        // Checks all extensions for a given base filename at once (instead of
        // one at a time) and returns the first URL that exists, or null. Uses
        // HEAD so we never download a full image body just to check it's there.
        const findVariant = async (base) => {
            const attempts = await Promise.all(
                extensions.map(async (ext) => {
                    const url = `assets/${base}.${ext}`;
                    try {
                        const response = await fetch(url, { method: 'HEAD' });
                        return response.ok ? url : null;
                    } catch (e) {
                        return null;
                    }
                })
            );
            return attempts.find(Boolean) || null;
        };

        const findGroup = async (index) => {
            const images = [];
            for (let sub = 1; sub <= MAX_GROUP_SIZE; sub++) {
                const src = await findVariant(`portfolio-${index}-${sub}`);
                if (!src) break;
                images.push({ src, alt: `Portfolio piece ${index}, image ${sub}` });
            }
            return images;
        };

        const probeIndex = async (index) => {
            const single = await findVariant(`portfolio-${index}`);
            if (single) return { type: 'image', src: single, alt: `Portfolio piece ${index}` };
            const groupImages = await findGroup(index);
            if (groupImages.length > 0) return { type: 'group', images: groupImages };
            return { type: 'empty' };
        };

        // Scan in small parallel batches rather than firing all 50 possible
        // slots (or checking one at a time). A batch resolves in roughly the
        // time of a single lookup, and we stop at the first real gap instead
        // of always probing the full range.
        const detectedItems = [];
        let consecutiveEmpty = 0;
        scan:
        for (let batchStart = 1; batchStart <= MAX_INDEX; batchStart += BATCH_SIZE) {
            const indices = [];
            for (let idx = batchStart; idx < batchStart + BATCH_SIZE && idx <= MAX_INDEX; idx++) indices.push(idx);
            const results = await Promise.all(indices.map(probeIndex));

            for (const result of results) {
                if (result.type === 'empty') {
                    consecutiveEmpty++;
                    if (consecutiveEmpty >= 2) break scan;
                } else {
                    consecutiveEmpty = 0;
                    detectedItems.push(result);
                }
            }
        }

        if (detectedItems.length === 0) {
            grid.innerHTML = '<p style="padding: 2rem; text-align: center;">Add images to assets/ named portfolio-1.jpg to see them here!</p>';
            return;
        }

        // Flatten into a single ordered list of slides for the lightbox, so
        // arrow keys/buttons browse the entire portfolio continuously, even
        // across grouped multi-image posts.
        const lightboxSlides = [];
        grid.innerHTML = '';

        detectedItems.forEach((item) => {
            const tile = document.createElement('button');
            tile.type = 'button';
            tile.className = 'portfolio-tile';

            const startSlide = lightboxSlides.length;

            if (item.type === 'group') {
                item.images.forEach((img, subIdx) => {
                    lightboxSlides.push({ src: img.src, alt: img.alt, groupIndex: subIdx + 1, groupTotal: item.images.length });
                });
                tile.innerHTML = `
                    <img src="${item.images[0].src}" alt="${item.images[0].alt}" loading="lazy">
                    <span class="portfolio-tile-badge">1 / ${item.images.length}</span>
                `;
            } else {
                lightboxSlides.push({ src: item.src, alt: item.alt });
                tile.innerHTML = `<img src="${item.src}" alt="${item.alt}" loading="lazy">`;
            }

            tile.addEventListener('click', () => openLightbox(startSlide));
            grid.appendChild(tile);
        });

        // --- LIGHTBOX LOGIC ---
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxClose = document.getElementById('lightbox-close');
        const lightboxPrev = document.getElementById('lightbox-prev');
        const lightboxNext = document.getElementById('lightbox-next');
        const lightboxCaption = document.getElementById('lightbox-caption');

        let currentSlide = 0;

        function renderSlide(idx) {
            if (idx < 0) idx = lightboxSlides.length - 1;
            else if (idx >= lightboxSlides.length) idx = 0;
            currentSlide = idx;

            const slide = lightboxSlides[currentSlide];
            lightboxImg.src = slide.src;
            lightboxImg.alt = slide.alt;

            let caption = `${currentSlide + 1} / ${lightboxSlides.length}`;
            if (slide.groupTotal) caption += ` · image ${slide.groupIndex} of ${slide.groupTotal}`;
            lightboxCaption.textContent = caption;
        }

        function openLightbox(idx) {
            renderSlide(idx);
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden'; // Stop scrolling
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = ''; // Resume scrolling
        }

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        if (lightboxPrev) lightboxPrev.addEventListener('click', () => renderSlide(currentSlide - 1));
        if (lightboxNext) lightboxNext.addEventListener('click', () => renderSlide(currentSlide + 1));

        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox || e.target === lightboxImg) closeLightbox();
            });
        }

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowLeft') renderSlide(currentSlide - 1);
            else if (e.key === 'ArrowRight') renderSlide(currentSlide + 1);
        });
    };

    initPortfolioGrid();

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
        portfolio: 'Portfolio',
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
