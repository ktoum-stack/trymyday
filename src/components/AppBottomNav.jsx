import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Offcanvas, ListGroup } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';

const AppBottomNav = () => {
    const { getCartCount } = useCart();
    const { t } = useLanguage();
    const { favorites } = useFavorites();
    const location = useLocation();
    const navigate = useNavigate();
    const [showSelections, setShowSelections] = useState(false);

    // Ne cacher la barre que si explicitement nécessaire (actuellement affichée partout)
    const isHidden = false;

    if (isHidden) return null;

    return (
        <div className="d-md-none fixed-bottom bg-white border-top shadow-sm" style={{ zIndex: 1020, paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="d-flex justify-content-around align-items-center" style={{ height: '60px' }}>
                <NavLink to="/" className={({ isActive }) => `text-decoration-none d-flex flex-column align-items-center justify-content-center w-100 h-100 ${isActive ? 'text-warning' : 'text-muted'}`}>
                    <i className="bi bi-house fs-4 mb-1" style={{ lineHeight: 1 }}></i>
                    <span style={{ fontSize: '0.62rem', fontWeight: '500' }}>{t('nav.home')}</span>
                </NavLink>

                <NavLink to="/shop" className={({ isActive }) => `text-decoration-none d-flex flex-column align-items-center justify-content-center w-100 h-100 ${isActive ? 'text-warning' : 'text-muted'}`}>
                    <i className="bi bi-shop fs-4 mb-1" style={{ lineHeight: 1 }}></i>
                    <span style={{ fontSize: '0.62rem', fontWeight: '500' }}>{t('nav.shop')}</span>
                </NavLink>

                <NavLink to="/shop?cat=Flash" className={({ isActive }) => `text-decoration-none d-flex flex-column align-items-center justify-content-center w-100 h-100 ${isActive ? 'text-danger fw-bold' : 'text-danger text-opacity-75'}`}>
                    <i className="bi bi-lightning-fill fs-4 mb-1" style={{ lineHeight: 1 }}></i>
                    <span style={{ fontSize: '0.62rem', fontWeight: '500' }}>{t('nav.flash')}</span>
                </NavLink>

                <div 
                    onClick={() => setShowSelections(true)} 
                    className={`text-decoration-none d-flex flex-column align-items-center justify-content-center w-100 h-100 ${showSelections ? 'text-warning' : 'text-muted'}`}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="position-relative">
                        <i className="bi bi-star fs-4 mb-1" style={{ lineHeight: 1 }}></i>
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: '500' }}>{t('nav.selections')}</span>
                </div>

                <NavLink to="/cart" className={({ isActive }) => `text-decoration-none d-flex flex-column align-items-center justify-content-center w-100 h-100 position-relative ${isActive ? 'text-warning' : 'text-muted'}`}>
                    <div className="position-relative">
                        <i className="bi bi-cart3 fs-4 mb-1" style={{ lineHeight: 1 }}></i>
                        {getCartCount() > 0 && (
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.5rem', padding: '0.2rem 0.35rem' }}>
                                {getCartCount()}
                            </span>
                        )}
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: '500' }}>{t('nav.cart')}</span>
                </NavLink>

                <NavLink to="/profile" className={({ isActive }) => `text-decoration-none d-flex flex-column align-items-center justify-content-center w-100 h-100 ${isActive ? 'text-warning' : 'text-muted'}`}>
                    <i className="bi bi-person fs-4 mb-1" style={{ lineHeight: 1 }}></i>
                    <span style={{ fontSize: '0.62rem', fontWeight: '500' }}>{t('nav.profile')}</span>
                </NavLink>
            </div>

            {/* Mobile Selections Bottom Sheet */}
            <Offcanvas 
                show={showSelections} 
                onHide={() => setShowSelections(false)} 
                placement="bottom" 
                className="h-auto border-top-0 rounded-top-4 section-mobile-nav"
                style={{ zIndex: 1060 }}
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title className="fw-bold fs-6 text-muted">SÉLECTIONS RAPIDES</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0 pb-4">
                    <ListGroup variant="flush">
                        <ListGroup.Item 
                            action 
                            onClick={() => { setShowSelections(false); navigate('/shop?sort=new'); }} 
                            className="border-0 py-3 d-flex align-items-center"
                        >
                            <div className="bg-light rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                <i className="bi bi-stars fs-5 text-warning"></i> 
                            </div>
                            <span className="fw-bold">Nouveautés</span>
                        </ListGroup.Item>
                        
                        <ListGroup.Item 
                            action 
                            onClick={() => { setShowSelections(false); navigate('/shop?cat=Flash'); }} 
                            className="border-0 py-3 d-flex align-items-center"
                        >
                            <div className="bg-light rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                <i className="bi bi-lightning-fill fs-5 text-danger"></i>
                            </div>
                            <span className="fw-bold text-danger">Offres Flash</span>
                        </ListGroup.Item>

                        <ListGroup.Item 
                            action 
                            onClick={() => { setShowSelections(false); navigate('/shop?cat=Gifts'); }} 
                            className="border-0 py-3 d-flex align-items-center"
                        >
                            <div className="bg-light rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                <i className="bi bi-gift fs-5 text-primary"></i>
                            </div>
                            <span className="fw-bold">Idées Cadeaux</span>
                        </ListGroup.Item>

                        <ListGroup.Item 
                            action 
                            onClick={() => { setShowSelections(false); navigate('/shop?cat=Collections'); }} 
                            className="border-0 py-3 d-flex align-items-center"
                        >
                            <div className="bg-light rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                <i className="bi bi-collection fs-5 text-success"></i>
                            </div>
                            <span className="fw-bold">Collections</span>
                        </ListGroup.Item>

                        <ListGroup.Item 
                            action 
                            onClick={() => { setShowSelections(false); navigate('/shop?cat=Best'); }} 
                            className="border-0 py-3 d-flex align-items-center"
                        >
                            <div className="bg-light rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                <i className="bi bi-fire fs-5 text-orange" style={{ color: '#ff6000' }}></i>
                            </div>
                            <span className="fw-bold" style={{ color: '#ff6000' }}>Meilleures Ventes</span>
                        </ListGroup.Item>
                    </ListGroup>
                </Offcanvas.Body>
            </Offcanvas>
        </div>
    );
};

export default AppBottomNav;
