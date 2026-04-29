import React, { useRef } from 'react';
import { Container, Button, Carousel, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import TranslatedText from '../components/TranslatedText';

const Home = () => {
    const { products } = useData();
    const { user } = useAuth();
    const { NoTranslate, t } = useLanguage();
    const navigate = useNavigate();
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const categories = [
        { name: 'Femme', image: '/assets/category_mode_1766034946780.png', link: '/shop?cat=Femme', icon: 'bi-person-heart' },
        { name: 'Homme', image: '/assets/cat_homme.png', link: '/shop?cat=Homme', icon: 'bi-person-check' },
        { name: 'Enfant', image: '/assets/cat_enfant.png', link: '/shop?cat=Enfant', icon: 'bi-smartwatch' },
        { name: 'Maison', image: '/assets/cat_maison.png', link: '/shop?cat=Maison %26 Meuble', icon: 'bi-house' },
        { name: 'Cosmétique', image: '/assets/cat_cosmetique.png', link: '/shop?cat=Cosmétique', icon: 'bi-magic' },
        { name: 'Chaussures', image: '/assets/cat_chaussures.png', link: '/shop?cat=Chaussures', icon: 'bi-bag-dash' },
        { name: 'Sacs', image: '/assets/cat_sacs.png', link: '/shop?cat=Sacs', icon: 'bi-handbag' },
        { name: 'Électronique', image: '/assets/category_tech_1766034965148.png', link: '/shop?cat=Électronique', icon: 'bi-laptop' },
    ];

    const brands = [
        { name: 'Nike', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
        { name: 'Adidas', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' },
        { name: 'Zara', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg' },
        { name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
        { name: 'Samsung', logo: 'https://logodix.com/logo/5010.gif' },
        { name: 'LC Waikiki', logo: 'https://www.capsacrecoeur.re/media/enseignes/logo/logo-lcw-512x2432-page-0001.jpg' },
        { name: 'DeFacto', logo: 'https://i.ytimg.com/vi/a0TATeKpWP4/maxresdefault.jpg' },
        { name: 'Flo', logo: 'https://i3.kuponla.com/wp-content/uploads/2019/12/flo-guncel-indirim-kuponlari-KUPONLACOM.jpg' },
        { name: 'Gratis', logo: 'https://th.bing.com/th/id/R.378025d751a1c477acea1d823881ea70?rik=SQyfcSp%2fJsZ2Jw&riu=http%3a%2f%2f3.bp.blogspot.com%2f-g-EVGo9KnRM%2fVJlFMqWLXuI%2fAAAAAAAAFnE%2fhwEjqE6oqgs%2fs1600%2fGratis-870x350.jpg&ehk=B%2b4zSKUaiGgk34Yg1gBB66eAdxFr6ybrEm1uQRwZx7c%3d&risl=&pid=ImgRaw&r=0' },
        { name: 'Watsons', logo: 'https://tse2.mm.bing.net/th/id/OIP.yd-tbxLLhTiVK3qLjU1UgQAAAA?w=300&h=59&rs=1&pid=ImgDetMain&o=7&rm=3' },
        { name: 'Gucci', logo: 'https://tse2.mm.bing.net/th/id/OIP.OhvpW9EsnRviqrFasMoenQHaBy?w=860&h=208&rs=1&pid=ImgDetMain&o=7&rm=3' },
        { name: 'Dior', logo: 'https://tse4.mm.bing.net/th/id/OIP.BHA8sdXscHDNjtn1ha-uxwAAAA?rs=1&pid=ImgDetMain&o=7&rm=3' },
        { name: 'H&M', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg' },
    ];

    const brandCampaigns = [
        {
            brand: 'LC Waikiki',
            logo: 'https://www.capsacrecoeur.re/media/enseignes/logo/logo-lcw-512x2432-page-0001.jpg',
            slogan: 'Style de Saison pour Tous',
            bgColor: '#F47B4E',
            products: [
                { img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80', price: '4500 FCFA' },
                { img: 'https://tse2.mm.bing.net/th/id/OIP.da95wHlDNb0Ozm9JP5l7CgHaFA?rs=1&pid=ImgDetMain&o=7&rm=3', price: '3200 FCFA' }
            ]
        },
        {
            brand: 'DeFacto',
            logo: 'https://i.ytimg.com/vi/a0TATeKpWP4/maxresdefault.jpg',
            slogan: 'Nouveau Look, Nouveau Vous',
            bgColor: '#9B6B9D',
            products: [
                { img: 'https://www.marketingturkiye.com.tr/wp-content/uploads/2020/09/shutterstock_image-82.jpg', price: '5800 FCFA' },
                { img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80', price: '4900 FCFA' }
            ]
        },
        {
            brand: 'Flo',
            logo: 'https://i3.kuponla.com/wp-content/uploads/2019/12/flo-guncel-indirim-kuponlari-KUPONLACOM.jpg',
            slogan: 'Vos Chaussures de Rêve',
            bgColor: '#BC4B5B',
            products: [
                { img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80', price: '12500 FCFA' },
                { img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80', price: '18000 FCFA' }
            ]
        },
        {
            brand: 'Zara',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg',
            slogan: 'Élégance Contemporaine',
            bgColor: '#4A8B9C',
            products: [
                { img: 'https://fastarz.com/wp-content/uploads/2024/04/img_1666380551_11zon-2-1024x683.jpeg', price: '25000 FCFA' },
                { img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=400&q=80', price: '35000 FCFA' }
            ]
        },
        {
            brand: 'Gratis',
            logo: 'https://th.bing.com/th/id/R.378025d751a1c477acea1d823881ea70?rik=SQyfcSp%2fJsZ2Jw&riu=http%3a%2f%2f3.bp.blogspot.com%2f-g-EVGo9KnRM%2fVJlFMqWLXuI%2fAAAAAAAAFnE%2fhwEjqE6oqgs%2fs1600%2fGratis-870x350.jpg&ehk=B%2b4zSKUaiGgk34Yg1gBB66eAdxFr6ybrEm1uQRwZx7c%3d&risl=&pid=ImgRaw&r=0',
            slogan: 'Prenez Soin de Vous',
            bgColor: '#E57373',
            products: [
                { img: 'https://www.theodysseyonline.com/media-library/image.jpg?id=10758141&width=980', price: '2500 FCFA' },
                { img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=400&q=80', price: '4500 FCFA' }
            ]
        },
        {
            brand: 'Apple',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
            slogan: 'L\'Innovation à l\'État Pur',
            bgColor: '#607D8B',
            products: [
                { img: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&q=80', price: '650.000 FCFA' },
                { img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80', price: '950.000 FCFA' }
            ]
        }
    ];

    const featuredProducts = products.slice(0, 6);

    return (
        <div className="home-page" style={{
            fontFamily: '"Segoe UI", Roboto, sans-serif',
            backgroundColor: '#fff',
            scrollBehavior: 'smooth'
        }}>
            {/* --- 1. CIRCULAR CATEGORY NAVIGATION  --- */}
            <div className="category-scroll-container py-1 border-bottom shadow-sm bg-white sticky-top" style={{ zIndex: 1020, top: '1px' }}>
                <Container>
                    <div className="d-flex justify-content-start justify-content-md-center overflow-auto gap-2 gap-md-3 py-1 no-scrollbar scroll-pill-container" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {categories.map((cat, idx) => (
                            <Link
                                key={idx}
                                to={cat.link}
                                className="text-decoration-none text-center d-flex flex-column align-items-center gap-1 group category-pill-item"
                                style={{ minWidth: '60px' }}
                            >
                                <div className="category-circle-wrapper position-relative p-1 rounded-circle border border-2 border-warning hover-scale cat-circle-size"
                                    style={{ transition: 'all 0.3s ease' }}>
                                    <div className="rounded-circle overflow-hidden w-100 h-100 border">
                                        <img
                                            src={cat.image}
                                            alt={cat.name}
                                            className="w-100 h-100 object-fit-cover transition-transform"
                                        />
                                    </div>
                                </div>
                                <span className="fw-bold text-dark text-nowrap cat-label-size">{t(`categories.${cat.name.toLowerCase()}`, cat.name)}</span>
                            </Link>
                        ))}
                    </div>
                </Container>
            </div>

            {/* --- 2. MAIN TOP CAROUSEL --- */}
            <Container className="py-2 py-md-4 mb-3 mb-md-5">
                <div className="rounded-4 overflow-hidden shadow-lg position-relative main-carousel-container" style={{ transition: 'all 0.5s ease' }}>
                    <Carousel interval={6000} fade className="h-100 main-hero-carousel" indicators={true}>
                        <Carousel.Item className="h-100">
                            <div className="h-100 w-100 position-relative">
                                <img
                                    src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=90"
                                    className="w-100 h-100 object-fit-cover"
                                    alt="Mode Luxe Femme"
                                    style={{ objectPosition: 'center 40%' }}
                                />
                                <div className="position-absolute h-100 w-100 top-0 start-0 d-flex align-items-center hero-overlay-left">
                                    <div className="ps-4 ps-md-5 ms-md-5 text-white animate-slide-right hero-text-wrapper">
                                        <span className="badge bg-warning text-dark mb-2 px-3 py-2 fw-bold rounded-pill responsive-badge" style={{ letterSpacing: '1px' }}>{t('nav.new_collection')}</span>
                                        <h1 className="fw-bold mb-3 text-shadow responsive-heading">{t('nav.elegance_reinvented')}</h1>
                                        <p className="lead mb-4 responsive-desc text-center" style={{ maxWidth: '500px', opacity: 0.9 }}>{t('nav.hero_description_1')}</p>
                                        <Link to="/shop?cat=Femme" className="btn btn-warning btn-lg rounded-pill px-5 fw-bold shadow-sm hover-scale responsive-btn">{t('nav.discover')}</Link>
                                    </div>
                                </div>
                            </div>
                        </Carousel.Item>

                        <Carousel.Item className="h-100">
                            <div className="h-100 w-100 position-relative">
                                <img
                                    src="https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1600&q=90"
                                    className="w-100 h-100 object-fit-cover"
                                    alt="Style Homme"
                                    style={{ objectPosition: 'center 20%' }}
                                />
                                <div className="position-absolute h-100 w-100 top-0 start-0 d-flex align-items-center hero-overlay-left">
                                    <div className="ps-4 ps-md-5 ms-md-5 text-white animate-slide-right hero-text-wrapper">
                                        <span className="badge bg-primary mb-2 px-3 py-2 fw-bold rounded-pill responsive-badge" style={{ letterSpacing: '1px' }}>{t('nav.men_fashion')}</span>
                                        <h1 className="fw-bold mb-3 text-shadow responsive-heading">{t('nav.modern_style')}</h1>
                                        <p className="lead mb-4 responsive-desc text-center" style={{ maxWidth: '500px', opacity: 0.9 }}>{t('nav.hero_description_2')}</p>
                                        <Link to="/shop?cat=Homme" className="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow-sm hover-scale responsive-btn">{t('nav.explore')}</Link>
                                    </div>
                                </div>
                            </div>
                        </Carousel.Item>

                        <Carousel.Item className="h-100">
                            <div className="h-100 w-100 position-relative">
                                <img
                                    src="https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1600&q=90"
                                    className="w-100 h-100 object-fit-cover"
                                    alt="Shopping Tech"
                                />
                                <div className="position-absolute h-100 w-100 top-0 start-0 d-flex align-items-center justify-content-center text-center hero-overlay-center">
                                    <div className="text-white hero-text-wrapper px-3">
                                        <span className="badge bg-info text-dark mb-2 px-3 py-2 fw-bold rounded-pill responsive-badge" style={{ letterSpacing: '1px' }}>{t('nav.tech_exclusivity')}</span>
                                        <h1 className="fw-bold mb-3 text-shadow animate-fade-up responsive-heading">{t('nav.innovation_tech')}</h1>
                                        <p className="lead mb-4 responsive-desc text-center" style={{ maxWidth: '500px', margin: '0 auto', opacity: 0.9 }}>{t('nav.hero_description_3')}</p>
                                        <Link to="/shop?cat=Électronique" className="btn btn-light btn-lg rounded-pill px-5 fw-bold text-dark hover-scale responsive-btn">{t('nav.see_tech')}</Link>
                                    </div>
                                </div>
                            </div>
                        </Carousel.Item>
                    </Carousel>
                </div>
            </Container>

            {/* --- 4. FEATURED PRODUCTS (HORIZONTAL SLIDER STYLE) --- */}
            <Container className="mb-4 mb-md-5 py-2 py-md-4 position-relative">
                <div className="d-flex justify-content-between align-items-center mb-3 mb-md-4">
                    <h3 className="fw-bold mb-0 border-start border-4 border-warning ps-2 ps-md-3 responsive-section-title">{t('nav.most_loved')}</h3>
                    <Link to="/shop" className="text-warning fw-bold text-decoration-none small">{t('common.view_all')} →</Link>
                </div>

                <div className="position-relative slider-wrapper px-md-2">
                    {/* Navigation Arrows */}
                    <Button
                        variant="white"
                        className="position-absolute start-0 top-50 translate-middle-y shadow-sm rounded-circle d-none d-md-flex align-items-center justify-content-center border hover-scale"
                        style={{ zIndex: 10, width: '45px', height: '45px', left: '-25px' }}
                        onClick={() => scroll('left')}
                    >
                        <i className="bi bi-chevron-left text-dark"></i>
                    </Button>

                    <div
                        ref={scrollRef}
                        className="d-flex overflow-auto gap-3 pb-3 no-scrollbar px-1"
                        style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
                    >
                        {featuredProducts.map((product) => (
                            <div key={product.id} className="featured-product-item" style={{ scrollSnapAlign: 'start' }}>
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>

                    <Button
                        variant="white"
                        className="position-absolute end-0 top-50 translate-middle-y shadow-sm rounded-circle d-none d-md-flex align-items-center justify-content-center border hover-scale"
                        style={{ zIndex: 10, width: '45px', height: '45px', right: '-25px' }}
                        onClick={() => scroll('right')}
                    >
                        <i className="bi bi-chevron-right text-dark"></i>
                    </Button>
                </div>
            </Container>


            {/* --- 6. BRAND CAMPAIGN BANNERS (Trendyol Style) --- */}
            <Container className="mb-4 mb-md-5 pb-3">
                <div className="d-flex justify-content-between align-items-center mb-3 mb-md-4">
                    <h3 className="fw-bold mb-0 border-start border-4 border-warning ps-2 ps-md-3 responsive-section-title">{t('nav.brand_destinations')}</h3>
                </div>
                <Row className="g-3 g-md-4">
                    {brandCampaigns.map((campaign, idx) => (
                        <Col key={idx} xs={6} lg={4}>
                            <div
                                className="campaign-card d-flex rounded-3 rounded-md-4 overflow-hidden shadow-sm border h-100"
                                style={{ cursor: 'pointer', transition: 'transform 0.3s ease', minHeight: '120px' }}
                                onClick={() => navigate(`/shop?brand=${encodeURIComponent(campaign.brand)}`)}
                            >
                                {/* Left: Product Previews */}
                                <div className="d-flex p-1 p-md-2 bg-white gap-1 gap-md-2 align-items-center justify-content-center" style={{ width: '60%' }}>
                                    {campaign.products.map((p, i) => (
                                        <div key={i} className="text-center">
                                            <div className="rounded-2 overflow-hidden border campaign-product-img">
                                                <img src={p.img} alt="product" className="w-100 h-100 object-fit-cover" />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Right: Brand & Slogan */}
                                <div
                                    className="d-flex flex-column justify-content-center p-2 px-md-3 text-white text-center"
                                    style={{ width: '40%', backgroundColor: campaign.bgColor }}
                                >
                                    <div className="bg-white rounded-2 p-1 mb-1 mb-md-2 mx-auto d-flex align-items-center justify-content-center shadow-sm campaign-logo-container">
                                        <img src={campaign.logo} alt={campaign.brand} className="mw-100 mh-100 object-fit-contain" style={{ padding: '2px' }} />
                                    </div>
                                    <h6 className="fw-bold mb-0 lh-sm campaign-slogan-text">
                                        <TranslatedText>{campaign.slogan}</TranslatedText>
                                    </h6>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </Container>

            {/* --- 7. SIMPLE LOGO LIST (Refined) --- */}
            <Container className="mb-4 mb-md-5 pb-3 pb-md-4">
                <div className="d-flex flex-wrap justify-content-center gap-3 gap-md-4 py-2 border-top pt-3 pt-md-4 grayscale-img" style={{ opacity: 0.5 }}>
                    {brands.map((brand, idx) => (
                        <img
                            key={idx}
                            src={brand.logo}
                            alt={brand.name}
                            className="brand-logo-bottom"
                            title={brand.name}
                        />
                    ))}
                </div>
            </Container>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                .category-circle-wrapper:hover {
                    border-color: #ffc107 !important;
                    transform: translateY(-5px);
                    box-shadow: 0 5px 15px rgba(255,193,7,0.3);
                }
                
                .category-circle-wrapper img { transition: transform 0.5s ease; }
                .category-pill-item:hover img { transform: scale(1.15); }

                .hover-scale-btn {
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .hover-scale-btn:hover {
                    transform: scale(1.05) translateY(-2px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                }

                .hover-scale-img img {
                    transition: transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
                }
                .hover-scale-img:hover img {
                    transform: scale(1.08);
                }
                
                .boutique-banner::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(rgba(0,0,0,0.4), transparent);
                    pointer-events: none;
                }

                .backdrop-blur {
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }

                .text-shadow {
                    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
                }

                .main-hero-carousel, 
                .main-hero-carousel .carousel-inner,
                .main-hero-carousel .carousel-item {
                    height: 100% !important;
                }

                .main-hero-carousel .carousel-control-prev,
                .main-hero-carousel .carousel-control-next {
                    width: 5%;
                }

                @keyframes slideRight {
                    from { transform: translateX(-50px) translateY(-50%); opacity: 0; }
                    to { transform: translateX(0) translateY(-50%); opacity: 1; }
                }
                .animate-slide-right { animation: slideRight 1s cubic-bezier(0.165, 0.84, 0.44, 1) forwards; }

                @keyframes slideLeft {
                    from { transform: translateX(50px) translateY(-50%); opacity: 0; }
                    to { transform: translateX(0) translateY(-50%); opacity: 1; }
                }
                .animate-slide-left { animation: slideLeft 1s cubic-bezier(0.165, 0.84, 0.44, 1) forwards; }
                
                .mini-hero .carousel-indicators [data-bs-target] {
                    width: 25px;
                    height: 2px;
                    margin: 0 3px;
                }
                .mini-hero .carousel-control-prev, 
                .mini-hero .carousel-control-next {
                    width: 10%;
                }

                .brand-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important;
                    border-color: #ffc107 !important;
                }

                .grayscale-img {
                    filter: grayscale(100%);
                    opacity: 0.6;
                    transition: all 0.3s ease;
                }

                .brand-card:hover .grayscale-img {
                    filter: grayscale(0%);
                    opacity: 1;
                    transform: scale(1.05);
                }

                .campaign-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 15px 30px rgba(0,0,0,0.12) !important;
                }

                .hero-overlay-left {
                    background: linear-gradient(90deg, rgba(0,0,0,0.7) 0%, transparent 60%);
                }
                .hero-overlay-center {
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(2px);
                }

                /* Mobile Responsiveness Rules */
                .main-carousel-container { height: 500px; }
                .responsive-badge { font-size: 1rem; }
                .responsive-heading { font-size: 3.5rem; }
                .responsive-btn { font-size: 1.1rem; padding: 0.6rem 2rem; }
                .featured-product-item { min-width: 220px; }
                .responsive-section-title { font-size: 1.5rem; }
                .campaign-product-img { width: 85px; height: 110px; }
                .campaign-logo-container { height: 38px; width: 85%; max-width: 90px; }
                .campaign-slogan-text { font-size: 0.75rem; }
                .brand-logo-bottom { height: 25px; width: auto; object-fit: contain; }

                /* Category circle default size */
                .cat-circle-size { width: 64px; height: 64px; }
                .cat-label-size { font-size: 0.78rem; }

                @media (max-width: 767.98px) {
                    .main-carousel-container { height: 320px !important; }
                    .hero-overlay-left, .hero-overlay-center {
                        background: rgba(0,0,0,0.55) !important;
                        justify-content: center !important;
                        text-align: center !important;
                        backdrop-filter: none !important;
                    }
                    .hero-text-wrapper {
                        padding: 0 1.5rem !important;
                        margin: 0 !important;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }
                    .responsive-badge { font-size: 0.65rem !important; margin-bottom: 0.3rem !important; padding: 0.25rem 0.6rem !important; }
                    .responsive-heading { font-size: 1.25rem !important; margin-bottom: 0.4rem !important; line-height: 1.2; text-align: center !important; }
                    .responsive-desc { 
                        font-size: 0.8rem !important; 
                        margin-bottom: 0.8rem !important; 
                        line-height: 1.4 !important; 
                        text-align: center !important; 
                        opacity: 0.95 !important;
                    }
                    .responsive-btn { font-size: 0.8rem !important; padding: 0.4rem 1.2rem !important; margin-top: 0.2rem !important; }
                    
                    /* Category circles smaller on mobile */
                    .cat-circle-size { width: 50px !important; height: 50px !important; }
                    .cat-label-size { font-size: 0.65rem !important; }
                    .category-pill-item { min-width: 52px !important; }

                    .featured-product-item { min-width: 155px !important; }
                    .responsive-section-title { font-size: 1.1rem !important; }
                    
                    /* Campaign Banners mobile adjustments */
                    .campaign-product-img { width: 58px !important; height: 76px !important; }
                    .campaign-logo-container { height: 26px !important; width: 90% !important; max-width: 68px !important; margin-bottom: 3px !important; }
                    .campaign-slogan-text { font-size: 0.62rem !important; }
                    
                    /* Bottom brand logos */
                    .brand-logo-bottom { height: 16px !important; }

                    /* Reduce container padding on mobile */
                    .container, .container-fluid { padding-left: 10px !important; padding-right: 10px !important; }
                }
            `}</style>
        </div >
    );
};

export default Home;
