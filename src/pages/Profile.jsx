import { useState } from 'react';
import { Row, Col, Card, ListGroup, Badge, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import ProfileLayout from '../components/ProfileLayout';
import { useLanguage } from '../context/LanguageContext';

const Profile = () => {
    const { t } = useLanguage();
    const { user, logout } = useAuth();
    const { orders, updateOrder } = useData();
    const navigate = useNavigate();
    const [showBalance, setShowBalance] = useState(false);

    if (!user) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center px-3 text-center" style={{ minHeight: '70vh' }}>
                <i className="bi bi-person-circle mb-4 text-muted" style={{ fontSize: '5rem', opacity: 0.3 }}></i>
                <h3 className="fw-bold mb-3" style={{ fontSize: '1.25rem' }}>{t('profile.login_prompt')}</h3>
                <p className="text-muted mb-4 small">{t('profile.login_subtitle')}</p>
                <Link to="/login" state={{ from: '/profile' }} className="btn btn-warning rounded-pill px-5 fw-bold shadow-sm" style={{ backgroundColor: '#ff6000', border: 'none', color: '#fff' }}>
                    {t('profile.login_btn')}
                </Link>
            </div>
        );
    }

    return (
        <ProfileLayout>
            {/* --- MOBILE DASHBOARD (Visible only on Mobile) --- */}
            <div className="d-md-none">
                {/* New Profile Card Design */}
                <Card 
                    className="border-0 shadow-sm mb-3 overflow-hidden mx-auto" 
                    style={{ 
                        borderRadius: '20px', 
                        background: 'linear-gradient(135deg, #f39d48 0%, #f1bb82 100%)',
                        color: 'white',
                        maxWidth: '360px'
                    }}
                >
                    <Card.Body className="p-3 text-center">
                        {/* Avatar Section */}
                        <div className="position-relative d-inline-block mb-2">
                            <div 
                                className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center shadow-sm" 
                                style={{ width: '70px', height: '70px', fontSize: '2rem', border: '3px solid rgba(255,255,255,0.3)' }}
                            >
                                {user.avatar || '👤'}
                            </div>
                            <Button 
                                variant="dark" 
                                size="sm" 
                                className="rounded-circle position-absolute bottom-0 end-0 d-flex align-items-center justify-content-center p-0 shadow-sm border-0" 
                                style={{ width: '24px', height: '24px', backgroundColor: '#333' }}
                                onClick={() => navigate('/profile/info')}
                            >
                                <i className="bi bi-pencil-fill text-white" style={{ fontSize: '0.65rem' }}></i>
                            </Button>
                        </div>
                        
                        <h5 className="fw-800 mb-3">{user.name}</h5>

                        {/* ID Field */}
                        <div 
                            className="bg-white bg-opacity-20 rounded-3 py-2 px-3 mb-2 d-flex align-items-center"
                            style={{ backdropFilter: 'blur(5px)' }}
                        >
                            <span className="fw-700 text-dark opacity-100" style={{ fontSize: '0.85rem' }}>
                                {t('profile.id')}: {user.id ? user.id.substring(0, 8) : '51442403'}
                            </span>
                        </div>

                        {/* Balance Field with Eye Icon */}
                        <div 
                            className="bg-white bg-opacity-20 rounded-3 py-2 px-3 d-flex align-items-center justify-content-between"
                            style={{ backdropFilter: 'blur(5px)' }}
                        >
                            <div className="d-flex align-items-center">
                                <i className="bi bi-wallet2 me-3 fs-6 text-dark"></i>
                                <span className="fw-700 text-dark" style={{ fontSize: '0.85rem' }}>
                                    {showBalance ? `${(user.balance || 0).toLocaleString()} FCFA` : '---'}
                                </span>
                            </div>
                            <Button 
                                variant="link" 
                                className="p-0 text-dark opacity-75 text-decoration-none"
                                onClick={() => setShowBalance(!showBalance)}
                            >
                                <i className={`bi bi-eye${showBalance ? '-slash' : ''} fs-6`}></i>
                            </Button>
                        </div>
                    </Card.Body>
                </Card>

                {/* Full Menu Sections for Mobile */}
                {[
                    {
                        title: t('profile.my_orders'),
                        items: [
                            { icon: 'bi-box-seam', label: t('profile.all_orders'), link: '/profile/orders' },
                            { icon: 'bi-arrow-repeat', label: t('profile.reorder'), link: '/profile/reorder' },
                        ]
                    },
                    {
                        title: t('profile.wallet_coupons'),
                        items: [
                            { icon: 'bi-wallet2', label: t('profile.wallet'), link: '/profile/wallet' },
                            { icon: 'bi-ticket-perforated', label: t('profile.coupons'), link: '/profile/coupons' },
                            { icon: 'bi-bell', label: t('nav.notifications'), link: '/notifications' },
                        ]
                    },
                    {
                        title: t('profile.account_help'),
                        items: [
                            { icon: 'bi-person', label: t('profile.user_info'), link: '/profile/info' },
                            { icon: 'bi-geo-alt', label: t('profile.addresses'), link: '/profile/addresses' },
                            { icon: 'bi-credit-card', label: t('profile.saved_cards'), link: '/profile/cards' },
                            { icon: 'bi-shield-lock', label: t('profile.privacy'), link: '/help' },
                            { icon: 'bi-toggle-on', label: t('profile.active_settings'), link: '/help' },
                            { icon: 'bi-question-circle', label: t('profile.help'), link: '/help' },
                        ]
                    }
                ].map((section, idx) => (
                    <div key={idx} className="mb-4">
                        <h6 className="mb-3 fw-800 text-muted px-2" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{section.title}</h6>
                        <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '20px' }}>
                            <ListGroup variant="flush">
                                {section.items.map((item, itemIdx) => (
                                    <ListGroup.Item 
                                        key={itemIdx} 
                                        action 
                                        className="border-0 py-3 px-3 d-flex align-items-center justify-content-between"
                                        onClick={() => navigate(item.link)}
                                    >
                                        <div className="d-flex align-items-center">
                                            <div 
                                                className="rounded-circle d-flex align-items-center justify-content-center me-3" 
                                                style={{ width: '38px', height: '38px', backgroundColor: '#f39d4815', color: '#f39d48' }}
                                            >
                                                <i className={`bi ${item.icon} fs-5`}></i>
                                            </div>
                                            <span className="fw-600 text-dark" style={{ fontSize: '0.9rem' }}>{item.label}</span>
                                        </div>
                                        <i className="bi bi-chevron-right text-muted small"></i>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card>
                    </div>
                ))}

                {/* Standing Logout Card */}
                <div className="text-center pb-3 mt-4">
                    <Button 
                        variant="white"
                        className="border-0 shadow-sm d-inline-flex align-items-center px-4 py-2" 
                        style={{ borderRadius: '50px', backgroundColor: 'white' }}
                        onClick={logout}
                    >
                        <div 
                            className="rounded-circle d-flex align-items-center justify-content-center me-2" 
                            style={{ width: '32px', height: '32px', backgroundColor: '#f39d4815', color: '#f39d48' }}
                        >
                            <i className="bi bi-box-arrow-right fs-6"></i>
                        </div>
                        <span className="fw-800" style={{ color: '#f39d48', fontSize: '0.9rem' }}>{t('profile.logout_btn')}</span>
                    </Button>
                </div>
            </div>

            {/* --- DESKTOP VIEW (Visible only on Desktop) --- */}
            <div className="d-none d-md-block">
                {/* Welcome Card */}
                <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '20px' }}>
                    <Card.Body className="p-4">
                        <h4 className="mb-2 fw-bold text-dark">{t('profile.welcome')}, {user.name} ! 👋</h4>
                        <p className="text-muted mb-0">
                            {t('profile.manage_profile')}
                        </p>
                    </Card.Body>
                </Card>

                {/* Quick Stats Grid */}
                <Row className="mb-4 g-3">
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100" style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            borderRadius: '16px'
                        }}>
                            <Card.Body className="text-center p-3">
                                <div className="mb-2" style={{ fontSize: '2rem' }}>📦</div>
                                <h5 className="mb-0 fw-bold">
                                    {orders.filter(o => o.email === user.email).length}
                                </h5>
                                <small className="opacity-75">{t('profile.stats.orders', 'Commandes')}</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100" style={{
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            color: 'white',
                            borderRadius: '16px'
                        }}>
                            <Card.Body className="text-center p-3">
                                <div className="mb-2" style={{ fontSize: '2rem' }}>❤️</div>
                                <h5 className="mb-0 fw-bold">
                                    {(() => {
                                        const favs = localStorage.getItem(`favorites_${user.email}`);
                                        return favs ? JSON.parse(favs).length : 0;
                                    })()}
                                </h5>
                                <small className="opacity-75">{t('profile.stats.favorites', 'Favoris')}</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100" style={{
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            color: 'white',
                            borderRadius: '16px'
                        }}>
                            <Card.Body className="text-center p-3">
                                <div className="mb-2" style={{ fontSize: '2rem' }}>🎟️</div>
                                <h5 className="mb-0 fw-bold">
                                    {(() => {
                                        const coupons = localStorage.getItem(`coupons_${user.email}`);
                                        if (!coupons) return 3;
                                        const parsed = JSON.parse(coupons);
                                        return parsed.filter(c => !c.used && new Date(c.expiryDate) > new Date()).length;
                                    })()}
                                </h5>
                                <small className="opacity-75">{t('profile.stats.coupons', 'Coupons')}</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100" style={{
                            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                            color: 'white',
                            borderRadius: '16px'
                        }}>
                            <Card.Body className="text-center p-3">
                                <div className="mb-2" style={{ fontSize: '2rem' }}>📍</div>
                                <h5 className="mb-0 fw-bold">
                                    {(() => {
                                        const addresses = localStorage.getItem(`addresses_${user.email}`);
                                        return addresses ? JSON.parse(addresses).length : 0;
                                    })()}
                                </h5>
                                <small className="opacity-75">{t('profile.stats.addresses', 'Adresses')}</small>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Recent Orders - Full Width */}
                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom p-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold">{t('profile.recent_orders')}</h6>
                            <Link to="/profile/orders" className="btn btn-sm btn-outline-warning">
                                {t('profile.view_all')}
                            </Link>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                        {orders.filter(o => o.email === user.email).slice(0, 3).length === 0 ? (
                            <div className="text-center p-5">
                                <i className="bi bi-box-seam" style={{ fontSize: '3rem', color: '#ddd' }}></i>
                                <p className="text-muted mt-3 mb-0">{t('profile.no_orders', 'Aucune commande')}</p>
                            </div>
                        ) : (
                            <ListGroup variant="flush">
                                {orders.filter(o => o.email === user.email).slice(0, 3).map(order => (
                                    <ListGroup.Item key={order.id} className="p-3 border-0 border-bottom">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center">
                                                <div className="me-3">
                                                    <div className="rounded-circle bg-light p-2 text-warning d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                                                        <i className="bi bi-box-seam fs-5"></i>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h6 className="mb-1 fw-bold">{t('profile.order_id')} #{order.id.length > 12 ? order.id.substring(0, 12) + '...' : order.id}</h6>
                                                    <small className="text-muted">
                                                        {order.date} <span className="mx-1">•</span> {order.items?.length || 0} {t('profile.items')}
                                                    </small>
                                                </div>
                                            </div>
                                            <div className="text-end">
                                                <Badge pill bg={
                                                    order.status === 'Livrée' ? 'success' :
                                                        order.status === 'En cours' ? 'warning' :
                                                            order.status === 'Annulée' ? 'danger' : 'secondary'
                                                }>
                                                    {order.status}
                                                </Badge>
                                                <div className="fw-bold text-success mt-1">{order.total.toLocaleString()} FCFA</div>
                                            </div>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </Card.Body>
                </Card>
            </div>
        </ProfileLayout>
    );
};

export default Profile;
