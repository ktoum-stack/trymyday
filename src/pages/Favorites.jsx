import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';

const Favorites = () => {
    const { t } = useLanguage();
    const { favorites } = useFavorites();
    const { products } = useData();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect if not logged in
    if (!user) {
        return (
            <Container className="py-5 text-center">
                <Alert variant="light" className="border">
                    <Alert.Heading>{t('favorites_page.login_required')}</Alert.Heading>
                    <p>{t('favorites_page.login_msg')}</p>
                    <Button variant="warning" className="text-white fw-bold shadow-sm px-4" onClick={() => navigate('/login', { state: { from: '/favorites', message: t('favorites_page.login_msg') } })}>
                        {t('profile.login_btn')}
                    </Button>
                </Alert>
            </Container>
        );
    }

    // Get favorite products
    const favoriteProducts = products.filter(p => favorites.some(favId => favId?.toString() === p.id?.toString()));

    return (
        <Container className="py-5" style={{ minHeight: '70vh' }}>
            <h2 className="mb-4 fw-bold">
                <i className="bi bi-heart-fill text-danger me-2"></i>
                {t('favorites_page.title')} ({favoriteProducts.length})
            </h2>

            {favoriteProducts.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-heart" style={{ fontSize: '5rem', color: '#ddd' }}></i>
                    <h3 className="mt-4 text-muted">{t('favorites_page.no_favorites')}</h3>
                    <p className="text-muted mb-4">{t('favorites_page.no_favorites_msg')}</p>
                    <Button variant="warning" className="text-white fw-bold" onClick={() => navigate('/shop')}>
                        {t('favorites_page.discover_products')}
                    </Button>
                </div>
            ) : (
                <Row className="g-4">
                    {favoriteProducts.map(product => (
                        <Col key={product.id} xs={6} sm={4} md={3} lg={3}>
                            <ProductCard product={product} />
                        </Col>
                    ))}
                </Row>
            )}

            <style>
                {`
                    .hover-effect:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
                        transition: all 0.3s ease;
                    }
                `}
            </style>
        </Container>
    );
};

export default Favorites;
