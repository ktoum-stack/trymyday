import { Card, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import TranslatedText from './TranslatedText';

const ProductCard = ({ product }) => {
    const { toggleFavorite, isFavorite } = useFavorites();
    const { user } = useAuth();
    const { NoTranslate, t } = useLanguage();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const favorite = isFavorite(product.id);

    const orangeAccent = '#f1823dff';

    // Flash sale logic
    const flashSale = product.flashSale;
    const isFlashActive = () => {
        if (!flashSale || !flashSale.discount) return false;
        const now = new Date();
        if (flashSale.startDate && now < new Date(flashSale.startDate)) return false;
        if (flashSale.endDate && now > new Date(flashSale.endDate)) return false;
        return true;
    };
    const flashActive = isFlashActive();
    const discountedPrice = flashActive ? Math.round(product.price * (1 - flashSale.discount / 100)) : null;

    const handleFavoriteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate('/register', { state: { from: `/product/${product.id}`, message: 'Inscrivez-vous pour ajouter des produits à vos favoris !' } });
            return;
        }

        toggleFavorite(product.id);
        const isNowFavorite = !favorite;
        showToast(
            isNowFavorite ? 'Ajouté aux favoris ❤️' : 'Retiré des favoris',
            isNowFavorite ? 'success' : 'info'
        );
    };

    return (
        <Card
            className="h-100 border-0 shadow-sm hover-up transition-all position-relative"
            onClick={() => navigate(`/product/${product.id}`)}
            style={{ cursor: 'pointer', borderRadius: '12px', overflow: 'hidden' }}
        >
            {/* Heart Icon (Floating) */}
            <div
                className="position-absolute top-0 end-0 p-2"
                style={{ zIndex: 10 }}
                onClick={handleFavoriteClick}
            >
                <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                    style={{ width: '30px', height: '30px', border: '1px solid #f0f0f0' }}>
                    <i className={`bi ${favorite ? 'bi-heart-fill text-danger' : 'bi-heart text-muted'}`} style={{ fontSize: '0.9rem' }}></i>
                </div>
            </div>

            {/* Product Image Wrapper (Standard Portrait Ratio) */}
            <div className="product-card-img-wrapper" style={{ overflow: 'hidden', backgroundColor: '#fcfcfc', position: 'relative' }}>
                <Card.Img
                    variant="top"
                    src={product.image || (product.images && product.images[0]) || '/assets/category_tech_1766034965148.png'}
                    alt={product.name}
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => { e.target.src = '/assets/category_tech_1766034965148.png'; }}
                />

                {/* Flash Sale Badge */}
                {flashActive && (
                    <div
                        className="position-absolute top-0 start-0 m-2 d-flex align-items-center gap-1 px-2 py-1 rounded-pill"
                        style={{ background: 'linear-gradient(135deg,#ff4757,#ff6b81)', color: '#fff', fontSize: '0.6rem', fontWeight: 'bold', zIndex: 5 }}
                    >
                        <i className="bi bi-lightning-fill"></i>
                        {t('nav.flash')} -{flashSale.discount}%
                    </div>
                )}

                {/* Bottom Image Banner (Status) - Only show for Limited Stock */}
                {product.stock > 0 && product.stock < 5 && (
                    <div className="position-absolute bottom-0 start-0 w-100 py-1"
                        style={{
                            backgroundColor: 'rgba(235, 64, 52, 0.9)',
                            textAlign: 'center',
                            fontSize: '0.65rem',
                            color: 'white',
                            fontWeight: 'bold',
                            zIndex: 2
                        }}>
                        <span>
                            <i className="bi bi-lightning-fill me-1"></i>
                            {t('cart.limited_stock')}
                        </span>
                    </div>
                )}
            </div>

            <Card.Body className="p-2 d-flex flex-column" style={{ minHeight: '100px' }}>
                {/* Product Name (Bold) */}
                <div className="fw-bold mb-0 text-dark text-truncate product-name-text" style={{ textTransform: 'capitalize' }}>
                    <TranslatedText>{product.name}</TranslatedText>
                </div>

                {/* Category (Lighter weight) */}
                <div className="mb-1 text-muted text-truncate category-text">
                    <TranslatedText>{product.category}</TranslatedText>
                </div>

                {/* Star Rating Row */}
                <div className="d-flex align-items-center gap-1 mb-1 rating-row">
                    <span className="fw-bold text-dark rating-value">4.5</span>
                    <div className="d-flex text-warning rating-stars">
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-half"></i>
                    </div>
                </div>

                {/* Price (Bottom Aligned) */}
                <div className="mt-auto pt-2 border-top border-light-subtle">
                    {flashActive ? (
                        <div className="d-flex align-items-baseline gap-1 flex-wrap">
                            <div className="fw-bolder product-price-text" style={{ color: '#ff4757' }}>
                                <NoTranslate>{discountedPrice?.toLocaleString() || 0} FCFA</NoTranslate>
                            </div>
                            <div className="text-muted text-decoration-line-through" style={{ fontSize: '0.7rem' }}>
                                <NoTranslate>{product.price?.toLocaleString() || 0}</NoTranslate>
                            </div>
                        </div>
                    ) : (
                        <div className="fw-bolder product-price-text" style={{ color: orangeAccent }}>
                            <NoTranslate>{product.price?.toLocaleString() || 0} FCFA</NoTranslate>
                        </div>
                    )}
                </div>
            </Card.Body>

            <style>{`
                .transition-all {
                    transition: all 0.25s ease-in-out;
                }
                .hover-up:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
                }
                
                /* Standard Portrait Aspect Ratio - Perfect 3:4 */
                .product-card-img-wrapper { 
                    aspect-ratio: 3 / 4;
                    width: 100%;
                }
                
                .product-name-text { font-size: 0.85rem; }
                .category-text { font-size: 0.75rem; }
                .rating-value { font-size: 0.7rem; }
                .rating-stars { font-size: 0.65rem; }
                .product-price-text { font-size: 0.95rem; }

                @media (max-width: 767.98px) {
                    .product-name-text { font-size: 0.75rem !important; }
                    .category-text { font-size: 0.65rem !important; }
                    .product-price-text { font-size: 0.85rem !important; }
                    .hover-up:hover { transform: none; }
                    .card-body { padding: 6px !important; }
                    .rating-row { gap: 2px !important; }
                }
            `}</style>
        </Card>
    );
};

export default ProductCard;
