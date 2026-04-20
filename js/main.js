document.addEventListener('DOMContentLoaded', () => {
    // GSAP Initializations
    gsap.registerPlugin(ScrollTrigger);

    // Reveal animations for sections
    const reveals = document.querySelectorAll('.reveal-up');
    reveals.forEach((el) => {
        gsap.from(el, {
            y: 50,
            opacity: 0,
            duration: 1.2,
            ease: "power4.out",
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none none"
            }
        });
    });

    // Custom Cursor Logic (Premium SaaS/Skincare style)
    const cursor = document.getElementById('custom-cursor');
    if (cursor) {
        document.addEventListener('mousemove', (e) => {
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.1,
                ease: "none"
            });
        });

        document.querySelectorAll('a, button, input, select, textarea').forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(cursor, { scale: 2.5, backgroundColor: 'rgba(245, 158, 11, 0.2)', backdropFilter: 'blur(4px)' });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(cursor, { scale: 1, backgroundColor: '#f59e0b', backdropFilter: 'none' });
            });
        });
    }

    // Parallax effect for portfolio images
    document.querySelectorAll('.portfolio-img').forEach(img => {
        gsap.to(img, {
            yPercent: -10,
            ease: "none",
            scrollTrigger: {
                trigger: img,
                scrub: true
            }
        });
    });
});
