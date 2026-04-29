import { Container, Row, Col } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useData, CATEGORIES } from '../context/DataContext';
import ProductCard from '../components/ProductCard';
import { useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

// ── Page configs for special pages ────────────────────────────────────────────
const SPECIAL_PAGES = (t) => ({
    Flash: {
        flag: 'flashSale',
        title: t('shop.flash_title'),
        subtitle: t('shop.flash_subtitle'),
        icon: '⚡',
        gradient: 'linear-gradient(135deg,#ff2d55 0%,#ff6b35 100%)',
        label: t('shop.flash_label'),
    },
    new: {
        flag: 'isNew',
        title: t('shop.new_title'),
        subtitle: t('shop.new_subtitle'),
        icon: '🌟',
        gradient: 'linear-gradient(135deg,#6a11cb 0%,#2575fc 100%)',
        label: t('shop.new_label'),
        sort: true,
    },
    Gifts: {
        flag: 'isGift',
        title: t('shop.gifts_title'),
        subtitle: t('shop.gifts_subtitle'),
        icon: '🎁',
        gradient: 'linear-gradient(135deg,#f953c6 0%,#b91d73 100%)',
        label: t('shop.gifts_label'),
    },
    Collections: {
        flag: 'isCollection',
        title: t('shop.collections_title'),
        subtitle: t('shop.collections_subtitle'),
        icon: '✨',
        gradient: 'linear-gradient(135deg,#11998e 0%,#38ef7d 100%)',
        label: t('shop.collections_label'),
    },
    Favorites: {
        flag: 'isFavorite',
        title: t('shop.favorites_title'),
        subtitle: t('shop.favorites_subtitle'),
        icon: '❤️',
        gradient: 'linear-gradient(135deg,#f7971e 0%,#ffd200 100%)',
        label: t('shop.favorites_label'),
    },
    Best: {
        flag: 'isBestSeller',
        title: t('shop.best_title'),
        subtitle: t('shop.best_subtitle'),
        icon: '🔥',
        gradient: 'linear-gradient(135deg,#f12711 0%,#f5af19 100%)',
        label: t('shop.best_label'),
    },
});

const Shop = () => {
    const { t } = useLanguage();
    const pages = SPECIAL_PAGES(t);
    const { products } = useData();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const catParam = queryParams.get('cat');
    const sortParam = queryParams.get('sort');
    const subParam = queryParams.get('sub');
    const brandParam = queryParams.get('brand');
    const searchParam = queryParams.get('search');

    const [filter, setFilter] = useState(catParam || 'All');
    const [subFilter, setSubFilter] = useState(subParam || 'All');
    const [brandFilter, setBrandFilter] = useState(brandParam || 'All');

    // Ticker for flash/countdown re-renders
    const [, setTick] = useState(0);
    useEffect(() => {
        if (catParam !== 'Flash') return;
        const t = setInterval(() => setTick(n => n + 1), 1000);
        return () => clearInterval(t);
    }, [catParam]);

    useEffect(() => {
        setFilter(catParam || 'All');
        setSubFilter(subParam || 'All');
        setBrandFilter(brandParam || 'All');
    }, [catParam, subParam, brandParam]);

    // ── Flash helpers ────────────────────────────────────────────────────────
    const isFlashActive = (product) => {
        const fs = product.flashSale;
        if (!fs || !fs.discount) return false;
        const now = new Date();
        if (fs.startDate && now < new Date(fs.startDate)) return false;
        if (fs.endDate && now > new Date(fs.endDate)) return false;
        return true;
    };

    const getCountdown = (endDate) => {
        if (!endDate) return null;
        const diff = new Date(endDate) - new Date();
        if (diff <= 0) return 'Terminée';
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Determine if we're on a special page
    const specialKey = catParam && pages[catParam]
        ? catParam
        : (sortParam === 'new' ? 'new' : null);
    const specialPage = specialKey ? pages[specialKey] : null;

    // ── Filtering ─────────────────────────────────────────────────────────────
    const filteredProducts = products.filter(p => {
        if (specialPage) {
            if (specialKey === 'Flash') return isFlashActive(p);
            if (specialKey === 'new') {
                // Show products flagged as new, OR recently added (fallback: first 20)
                return p.isNew === true || p.isNew === 'true';
            }
            // For other special pages, check the flag
            const flag = specialPage.flag;
            return p[flag] === true || p[flag] === 'true';
        }
        const matchesCat = filter === 'All' || p.category === filter;
        const matchesSub = subFilter === 'All' || p.subcategory === subFilter;
        const matchesBrand = brandFilter === 'All' || (p.brand && p.brand.toLowerCase() === brandFilter.toLowerCase());
        const matchesSearch = !searchParam || p.name?.toLowerCase().includes(searchParam.toLowerCase()) || p.description?.toLowerCase().includes(searchParam.toLowerCase());
        return matchesCat && matchesSub && matchesBrand && matchesSearch;
    });

    const pageTitle = specialPage
        ? specialPage.title
        : searchParam
            ? `${t('shop.results_for')} "${searchParam}"`
            : brandFilter !== 'All'
                ? `${t('shop.products')} ${brandFilter}`
                : filter === 'All'
                    ? t('shop.all_products')
                    : subFilter === 'All' ? filter : subFilter;

    return (
        <Container className="py-3">

            {/* Mobile Category Horizontal Scroll Bar */}
            <div className="d-md-none mb-3 overflow-auto no-scrollbar scroll-pill-container pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="d-flex gap-2 px-1">
                    <Link
                        to="/shop"
                        className={`text-decoration-none px-3 py-1 rounded-pill border ${filter === 'All' && !specialKey && !searchParam && brandFilter === 'All' ? 'bg-warning text-dark fw-bold border-warning' : 'bg-white text-muted border-secondary-subtle'}`}
                        style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                    >
                        {t('nav.all_categories')}
                    </Link>
                    {Object.keys(CATEGORIES).map((cat, idx) => (
                        <Link
                            key={idx}
                            to={`/shop?cat=${encodeURIComponent(cat)}`}
                            className={`text-decoration-none px-3 py-1 rounded-pill border ${filter === cat && !specialKey ? 'bg-warning text-dark fw-bold border-warning' : 'bg-white text-muted border-secondary-subtle'}`}
                            style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        >
                            {cat}
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Flash-only Hero Banner ────────────────────────────────── */}
            {specialKey === 'Flash' && specialPage && (
                <div
                    className="rounded-4 mb-3 p-2 p-md-3 px-md-4 d-flex align-items-center justify-content-between"
                    style={{
                        background: specialPage.gradient,
                        color: '#fff',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', top: '-60px', right: '-40px', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', bottom: '-40px', left: '20%', pointerEvents: 'none' }} />

                    <div className="d-flex align-items-center gap-2 gap-md-3" style={{ zIndex: 1 }}>
                        <div className="fs-4 fs-md-1" style={{ lineHeight: 1, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }}>⚡</div>
                        <div>
                            <h1 className="fw-bold mb-0" style={{ fontSize: '1rem', fontSizeMd: '1.4rem', letterSpacing: '-0.3px' }}>Offres Flash</h1>
                            <p className="mb-0 d-none d-md-block" style={{ fontSize: '0.85rem', opacity: 0.9, maxWidth: '420px' }}>
                                Des réductions limitées dans le temps — Ne ratez pas ces prix explosifs !
                            </p>
                        </div>
                    </div>
                    <div className="text-end d-flex flex-column align-items-end" style={{ zIndex: 1 }}>
                        <div className="fw-bold" style={{ opacity: 0.8, fontSize: '0.6rem', fontSizeMd: '0.75rem', letterSpacing: '0.5px' }}>EN PROMO</div>
                        <div className="fw-900" style={{ fontSize: '1.3rem', fontSizeMd: '2.2rem', letterSpacing: '-0.5px', lineHeight: 1 }}>
                            {filteredProducts.length}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Title for all pages (normal + other special pages) ────── */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
                <div>
                    <h1 className="fw-bold mb-0 fs-2">{pageTitle}</h1>
                    <p className="text-muted mb-0 small">{filteredProducts.length} {t('shop.products_found')}</p>
                </div>
            </div>

            {/* ── Flash grid (with live countdown ribbon) ───────────────── */}
            {specialKey === 'Flash' ? (
                filteredProducts.length > 0 ? (
                    <Row className="g-4">
                        {filteredProducts.map(product => {
                            const fs = product.flashSale;
                            const countdown = fs?.endDate ? getCountdown(fs.endDate) : null;
                            return (
                                <Col key={product.id} xs={6} sm={4} md={3} lg={2}>
                                    <div className="position-relative">
                                        <ProductCard product={product} />
                                        {countdown && countdown !== 'Terminée' && (
                                            <div
                                                className="text-center fw-bold"
                                                style={{
                                                    background: 'linear-gradient(135deg,#ff2d55,#ff6b35)',
                                                    color: '#fff',
                                                    fontSize: '0.62rem',
                                                    borderRadius: '0 0 12px 12px',
                                                    marginTop: '-4px',
                                                    padding: '4px 8px',
                                                    letterSpacing: '0.5px'
                                                }}
                                            >
                                                ⏱ {countdown}
                                            </div>
                                        )}
                                        {countdown === 'Terminée' && (
                                            <div className="text-center fw-bold text-muted" style={{ background: '#f0f0f0', fontSize: '0.62rem', borderRadius: '0 0 12px 12px', marginTop: '-4px', padding: '4px 8px' }}>
                                                Terminée
                                            </div>
                                        )}
                                        {!countdown && (
                                            <div className="text-center fw-bold" style={{ background: 'linear-gradient(135deg,#ff2d55,#ff6b35)', color: '#fff', fontSize: '0.62rem', borderRadius: '0 0 12px 12px', marginTop: '-4px', padding: '4px 8px' }}>
                                                ⚡ -{fs.discount}% FLASH
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                ) : (
                    <EmptySpecial icon="⚡" title="Aucune vente flash active" subtitle="Revenez bientôt pour profiter de nos offres flash !" />
                )

            ) : specialPage ? (
                /* ── Other special pages grid ─────────────────────────── */
                filteredProducts.length > 0 ? (
                    <Row className="g-4">
                        {filteredProducts.map(product => (
                            <Col key={product.id} xs={6} sm={4} md={3} lg={2}>
                                <ProductCard product={product} />
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <EmptySpecial icon={specialPage.icon} title={`Aucun produit dans "${specialPage.title}"`} subtitle="L'administrateur peut ajouter des produits dans cette sélection depuis le panneau d'administration." />
                )

            ) : (
                /* ── Normal category grid ─────────────────────────────── */
                <>
                    <Row className="g-4">
                        {filteredProducts.map(product => (
                            <Col key={product.id} xs={6} sm={4} md={3} lg={2}>
                                <ProductCard product={product} />
                            </Col>
                        ))}
                    </Row>
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-5">
                            <h3 className="text-muted">
                                {t('shop.no_products_found')}{searchParam ? ` ${t('shop.for')} "${searchParam}"` : ` ${t('shop.in_cat')}`}.
                            </h3>
                        </div>
                    )}
                </>
            )}
        </Container>
    );
};

// ── Empty state component ─────────────────────────────────────────────────────
const EmptySpecial = ({ icon, title, subtitle }) => (
    <div className="text-center py-5">
        <div style={{ fontSize: '5rem', lineHeight: 1 }}>{icon}</div>
        <h3 className="fw-bold mt-4 mb-2">{title}</h3>
        <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto' }}>{subtitle}</p>
    </div>
);

export default Shop;
