document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel-inner');
    const items = document.querySelectorAll('.carousel-item');
    const prevBtn = document.querySelector('.carousel-control.prev');
    const nextBtn = document.querySelector('.carousel-control.next');
    
    let currentIndex = 0;
    
    function showSlide(index) {
        if (index < 0) {
            currentIndex = items.length - 1;
        } else if (index >= items.length) {
            currentIndex = 0;
        } else {
            currentIndex = index;
        }
        
        const offset = -currentIndex * 100;
        carousel.style.transform = `translateX(${offset}%)`;
    }
    
    prevBtn.addEventListener('click', () => {
        showSlide(currentIndex - 1);
    });
    
    nextBtn.addEventListener('click', () => {
        showSlide(currentIndex + 1);
    });
    
    // Optional: Auto-advance
    // setInterval(() => {
    //     showSlide(currentIndex + 1);
    // }, 5000);
});
