document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const filterContainer = document.getElementById('filter-container');
    const searchInput = document.getElementById('search-input');

    let allProducts = [];
    let currentFilter = 'Todos';

    // 1. Fetch Data
    fetch('src/data/products.json')
        .then(res => res.json())
        .then(data => {
            allProducts = data.products;
            renderFilters(data.categories);
            renderProducts(allProducts);
        })
        .catch(err => console.error('Error loading products:', err));

    // 2. Render Filters
    function renderFilters(categories) {
        if (!filterContainer) return;
        filterContainer.innerHTML = categories.map(cat => `
            <button class="filter-btn ${cat === 'Todos' ? 'active' : ''}" data-category="${cat}">
                ${cat}
            </button>
        `).join('');

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.category;
                filterAndRender();
            });
        });
    }

    // 3. Render Products
    function renderProducts(products) {
        if (!productGrid) return;

        if (products.length === 0) {
            productGrid.innerHTML = `
                <div class="no-results animate-fade-in">
                    <p>Nenhum amigurumi encontrado com esses termos. :(</p>
                </div>
            `;
            return;
        }

        productGrid.innerHTML = products.map((p, index) => `
            <article class="product-card reveal" style="transition-delay: ${index * 100}ms">
                <div class="product-card__media">
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                    <video class="product-card__video" src="${p.video}" loop muted playsinline></video>
                    ${p.stock ? '' : '<span class="badge badge--out">Esgotado</span>'}
                </div>
                <div class="product-card__info">
                    <span class="product-card__category">${p.category}</span>
                    <h3 class="product-card__name">${p.name}</h3>
                    <div class="product-card__footer">
                        <span class="product-card__price">R$ ${p.price.toFixed(2).replace('.', ',')}</span>
                        <button class="btn-buy btn-hover" onclick="openWhatsApp('${p.name}')">
                            <i class="fab fa-whatsapp"></i> Pedir
                        </button>
                    </div>
                </div>
            </article>
        `).join('');

        // Trigger reveal animation
        setTimeout(() => {
            document.querySelectorAll('.product-card').forEach(card => card.classList.add('active'));
        }, 100);

        // Video Hover Logic
        document.querySelectorAll('.product-card').forEach(card => {
            const video = card.querySelector('video');
            card.addEventListener('mouseenter', () => video && video.play());
            card.addEventListener('mouseleave', () => {
                if (video) {
                    video.pause();
                    video.currentTime = 0;
                }
            });
        });
    }

    // 4. Filter and Search Logic
    function filterAndRender() {
        const query = searchInput ? searchInput.value.toLowerCase() : '';
        const filtered = allProducts.filter(p => {
            const matchesFilter = currentFilter === 'Todos' || p.category === currentFilter;
            const matchesSearch = p.name.toLowerCase().includes(query) ||
                p.tags.some(t => t.toLowerCase().includes(query));
            return matchesFilter && matchesSearch;
        });
        renderProducts(filtered);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterAndRender);
    }
});

// Global WhatsApp Function
window.openWhatsApp = (productName) => {
    const phone = "5511999999999"; // Substituir pelo real
    const message = encodeURIComponent(`Olá! Gostaria de saber mais sobre o amigurumi: ${productName}. Vi no site e amei!`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
};
