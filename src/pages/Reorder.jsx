import { Card, Button, Row, Col, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useCart } from '../context/CartContext';
import ProfileLayout from '../components/ProfileLayout';
import { useLanguage } from '../context/LanguageContext';

const Reorder = () => {
    const { user } = useAuth();
    const { orders } = useData();
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Filter orders by user email and only show completed/delivered orders
    const completedOrders = orders.filter(order =>
        order.email === user?.email &&
        (order.status === 'Livrée' || order.status === 'Complétée')
    );

    const handleReorderAll = (order) => {
        order.items?.forEach(item => {
            addToCart(item);
        });
        showToast(t('reorder.items_added').replace('{count}', order.items?.length), 'success');
        navigate('/cart');
    };

    const handleReorderItem = (item) => {
        addToCart(item);
        showToast(t('reorder.item_added'), 'success');
    };

    if (!user) {
        return (
            <ProfileLayout>
                <div className="mb-4">
                    <h3 className="fw-bold">{t('reorder.title')}</h3>
                    <p className="text-muted">{t('reorder.subtitle')}</p>
                </div>
                <Card className="border-0 shadow-sm text-center p-5">
                    <i className="bi bi-person-x" style={{ fontSize: '4rem', color: '#ddd' }}></i>
                    <h5 className="mt-3">{t('reorder.login_required')}</h5>
                    <p className="text-muted">{t('reorder.login_msg')}</p>
                    <Button variant="warning" className="text-white mt-2" onClick={() => navigate('/login')}>
                        {t('reorder.login_btn')}
                    </Button>
                </Card>
            </ProfileLayout>
        );
    }

    return (
        <ProfileLayout>
            <div className="mb-4">
                <h3 className="fw-bold text-dark mb-1">{t('reorder.title')}</h3>
                <p className="text-muted small">{t('reorder.subtitle')}</p>
            </div>

            {completedOrders.length === 0 ? (
                <Card className="border-0 shadow-sm text-center p-5 rounded-4">
                    <div className="mb-4" style={{ opacity: 0.5 }}>
                        <i className="bi bi-box-seam" style={{ fontSize: '5rem', color: '#ffc107' }}></i>
                    </div>
                    <h5 className="fw-bold">{t('reorder.empty_title')}</h5>
                    <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px' }}>
                        {t('reorder.empty_msg')}
                    </p>
                    <Button
                        variant="warning"
                        className="text-white px-4 py-2 rounded-pill fw-bold shadow-sm"
                        onClick={() => navigate('/shop')}
                    >
                        {t('reorder.browse_shop')}
                    </Button>
                </Card>
            ) : (
                <div className="d-flex flex-column gap-4">
                    {completedOrders.map(order => (
                        <Card key={order.id} className="border-0 shadow-sm overflow-hidden rounded-4 transition-all hover-shadow">
                            {/* Card Header */}
                            <div className="px-4 py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(255, 193, 7, 0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <div className="d-flex align-items-center">
                                    <div className="bg-white rounded-3 p-2 shadow-sm me-3 text-center" style={{ width: '45px', height: '45px', border: '1px solid #eee' }}>
                                        <i className="bi bi-receipt text-warning fs-5"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold mb-0">{t('reorder.order_num').replace('{id}', order.id)}</div>
                                        <small className="text-muted">{t('reorder.delivered_on').replace('{date}', order.date)}</small>
                                    </div>
                                </div>
                                <div className="d-flex gap-2 align-items-center">
                                    <Badge bg="success" className="rounded-pill px-3 py-2 fw-medium" style={{ fontSize: '0.7rem' }}>
                                        <i className="bi bi-check2-circle me-1"></i> {t('reorder.delivered')}
                                    </Badge>
                                    <Button
                                        variant="warning"
                                        size="sm"
                                        className="text-white fw-bold px-3 py-2 rounded-pill shadow-sm"
                                        onClick={() => handleReorderAll(order)}
                                    >
                                        <i className="bi bi-arrow-repeat me-1"></i>
                                        {t('reorder.reorder_all')}
                                    </Button>
                                </div>
                            </div>

                            <Card.Body className="p-4">
                                <Row className="g-4">
                                    {order.items?.map((item, index) => (
                                        <Col key={index} md={6}>
                                            <div className="d-flex align-items-center p-3 rounded-4 bg-light border-0 hover-bg-white transition-all shadow-hover h-100">
                                                <div className="position-relative">
                                                    <img
                                                        src={item.image || 'https://via.placeholder.com/80x80?text=Product'}
                                                        alt={item.name}
                                                        style={{
                                                            width: '70px',
                                                            height: '70px',
                                                            objectFit: 'cover',
                                                            borderRadius: '12px',
                                                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                                        }}
                                                    />
                                                    <Badge
                                                        bg="dark"
                                                        className="position-absolute bottom-0 end-0 rounded-circle p-1 d-flex align-items-center justify-content-center"
                                                        style={{ width: '22px', height: '22px', fontSize: '0.6rem', border: '2px solid white', transform: 'translate(5px, 5px)' }}
                                                    >
                                                        x{item.quantity}
                                                    </Badge>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6 className="mb-1 fw-bold text-dark text-truncate" style={{ maxWidth: '180px' }}>{item.name}</h6>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div className="fw-bold text-warning fs-6">{item.price.toLocaleString()} FCFA</div>
                                                        <Button
                                                            variant="white"
                                                            size="sm"
                                                            className="rounded-circle shadow-sm border p-0 d-flex align-items-center justify-content-center transition-all hover-warning"
                                                            style={{ width: '32px', height: '32px' }}
                                                            onClick={() => handleReorderItem(item)}
                                                            title={t('reorder.add_again')}
                                                        >
                                                            <i className="bi bi-cart-plus text-warning"></i>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>

                                <div className="mt-4 pt-4 border-top d-flex justify-content-between align-items-center">
                                    <div className="text-muted small">
                                        <i className="bi bi-box-seam me-1"></i> {order.items?.length} {t('reorder.articles')} • {t('reorder.taxes_included')}
                                    </div>
                                    <div className="text-end">
                                        <div className="text-muted small mb-1">{t('reorder.total_paid')}</div>
                                        <div className="fw-bold text-success fs-4">{order.total.toLocaleString()} FCFA</div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            )}
        </ProfileLayout>
    );
};

export default Reorder;
