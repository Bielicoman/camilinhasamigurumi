let cart = [];
        let currentSlide = 0;
        const slides = document.querySelectorAll('.hero-slide');

        // GSAP Plugins
        gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

        // Smooth Scroll with GSAP + navbar offset
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const target = document.querySelector(targetId);
                if (target) {
                    const navHeight = document.getElementById('main-nav').offsetHeight;
                    gsap.to(window, {
                        duration: 1.2,
                        scrollTo: { y: target, offsetY: navHeight + 10 },
                        ease: "power3.inOut"
                    });
                }
            });
        });

        function nextSlide() {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
            setTimeout(nextSlide, 10000);
        }

        window.onload = () => {
            const tl = gsap.timeline();

            tl.to("#loader-line", { width: "100%", duration: 1.5, ease: "power2.inOut" })
                .to(".loader-logo", { scale: 1.1, opacity: 0, duration: 0.8, ease: "power2.in" }, "-=0.3")
                .to("#loader", { opacity: 0, pointerEvents: "none", duration: 1, ease: "power2.out" }, "-=0.5")
                .from(".hero-title", { y: 50, opacity: 0, duration: 1, ease: "power4.out" }, "-=0.5")
                .from(".btn-netflix-main", { scale: 0.8, opacity: 0, duration: 0.8, ease: "back.out(1.7)" }, "-=0.8");

            setTimeout(nextSlide, 10000);

            const cursor = document.getElementById('custom-cursor');
            const interactiveLogo = document.querySelector('.logo-interactive');

            window.addEventListener('mousemove', (e) => {
                gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1, ease: "power2.out" });

                if (interactiveLogo) {
                    const rect = interactiveLogo.getBoundingClientRect();
                    const logoX = e.clientX - (rect.left + rect.width / 2);
                    const logoY = e.clientY - (rect.top + rect.height / 2);
                    gsap.to(interactiveLogo, {
                        filter: `invert(1) sepia(1) saturate(20) hue-rotate(-15deg) brightness(1.1) drop-shadow(${logoX * 0.1}px ${logoY * 0.1}px 10px rgba(245, 158, 11, 0.6))`,
                        duration: 0.4,
                        ease: "power2.out"
                    });
                }
            });

            const interactives = document.querySelectorAll('button, a, .product-card, input, textarea');
            interactives.forEach(el => {
                el.addEventListener('mouseenter', () => { gsap.to(cursor, { scale: 4, backgroundColor: 'rgba(245, 158, 11, 0.3)', duration: 0.3 }); });
                el.addEventListener('mouseleave', () => { gsap.to(cursor, { scale: 1, backgroundColor: '#f59e0b', duration: 0.3 }); });
            });
        };

        function toggleCart() { document.getElementById('cart-drawer').classList.toggle('active'); }

        function addToCart(name, price) {
            cart.push({ name, price, type: 'standard' });
            updateCart();
            const cartBtn = document.getElementById('cart-btn');
            gsap.to(cartBtn, { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" });
        }

        function updateCart() {
            const list = document.getElementById('cart-items');
            const count = document.getElementById('cart-count');
            const totalEl = document.getElementById('cart-total');
            list.innerHTML = '';
            let total = 0;
            cart.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5 mb-3';
                div.innerHTML = `<div class="text-xs font-black text-white h-serif">${item.name}</div><div class="flex items-center gap-3 font-black text-amber-500 text-xs">R$ ${item.price}<button onclick="removeFromCart(${index})" class="text-white/20 hover:text-red-500">&times;</button></div>`;
                list.appendChild(div);
                total += item.price;
            });
            count.innerText = cart.length;
            totalEl.innerText = `R$ ${total.toFixed(2)}`;
        }

        function removeFromCart(index) { cart.splice(index, 1); updateCart(); }

        function addCustomField() {
            const container = document.getElementById('custom-orders-container');
            const newField = document.createElement('div');
            newField.className = 'bg-white/5 p-6 rounded-3xl border border-white/5 relative group';
            newField.innerHTML = `
                <textarea placeholder="Descreva outro pedido personalizado..."
                    class="w-full bg-transparent border-none text-white placeholder-white/20 focus:ring-0 text-sm h-32 resize-none custom-desc"></textarea>
                <button onclick="this.parentElement.remove()" class="absolute top-4 right-4 text-white/20 hover:text-red-500 transition-colors">Ã—</button>
            `;
            container.appendChild(newField);
        }

        function submitCustomOrder() {
            const descs = Array.from(document.querySelectorAll('.custom-desc')).map(t => t.value).filter(v => v.trim());
            if (descs.length === 0) {
                alert('Por favor, descreva seu pedido.');
                return;
            }

            const message = `OlÃ¡! Gostaria de fazer orÃ§amentos personalizados para:\n\n${descs.join('\n\n--- NEXT ---\n\n')}`;
            window.open(`https://wa.me/5567999999999?text=${encodeURIComponent(message)}`, '_blank');
        }

        function finalizeOrder() {
            if (cart.length === 0) return alert('Sacola vazia!');
            let message = `*NOVO PEDIDO - CAMILINHAS*\n==================================\n\n`;
            let total = 0;
            const standard = cart.filter(i => i.type === 'standard');
            if (standard.length > 0) {
                message += `*VITRINE:* \n`;
                standard.forEach(i => { message += `- ${i.name} (R$ ${i.price.toFixed(2)})\n`; total += i.price; });
            }
            const custom = cart.filter(i => i.type === 'custom');
            if (custom.length > 0) {
                message += `\n*ENCOMENDAS:* \n`;
            }
            message += `\n==================================\n*TOTAL:* R$ ${total.toFixed(2)}\n\nOlÃ¡ Adriana! Vi seu catÃ¡logo e gostaria de fazer esse pedido.`;
            window.open(`https://wa.me/556792804803?text=${encodeURIComponent(message)}`, '_blank');
        }

        window.addEventListener('scroll', () => {
            const nav = document.getElementById('main-nav');
            if (window.scrollY > 50) nav.querySelector('div').classList.add('bg-[#1a1a1a]/90', 'shadow-2xl');
            else nav.querySelector('div').classList.remove('bg-[#1a1a1a]/90', 'shadow-2xl');
        });

        function toggleMobileMenu() {
            const nav = document.getElementById('nav-links');
            const icon = document.getElementById('menu-icon');
            nav.classList.toggle('mobile-active');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
            if (nav.classList.contains('mobile-active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        }

        document.querySelectorAll('#nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                const nav = document.getElementById('nav-links');
                if (nav.classList.contains('mobile-active')) {
                    toggleMobileMenu();
                }
            });
        });
        // --- Product Lightbox ---
        function openLightbox(imgSrc, title, price) {
            const lb = document.getElementById('product-lightbox');
            document.getElementById('lightbox-img').src = imgSrc;
            document.getElementById('lightbox-title').textContent = title;
            document.getElementById('lightbox-price').textContent = price;
            lb.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            const lb = document.getElementById('product-lightbox');
            lb.classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        // Lightbox: delegate clicks on product images
        document.querySelectorAll('.product-card').forEach(card => {
            const img = card.querySelector('img');
            const title = card.querySelector('.product-title')?.textContent || '';
            const price = card.querySelector('.product-price')?.textContent || '';
            if (img) {
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openLightbox(img.src, title, price);
                });
            }
        });

        // ESC to close lightbox
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeLightbox();
        });

        // --- Theme Toggle ---
        function toggleTheme() {
            const html = document.documentElement;
            const icon = document.getElementById('theme-icon');
            html.classList.toggle('light');
            const isLight = html.classList.contains('light');
            icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
            localStorage.setItem('camilinhas-theme', isLight ? 'light' : 'dark');
        }

        // Restore saved theme
        (function() {
            const saved = localStorage.getItem('camilinhas-theme');
            if (saved === 'light') {
                document.documentElement.classList.add('light');
                const icon = document.getElementById('theme-icon');
                if (icon) icon.className = 'fas fa-sun';
            }
        })();