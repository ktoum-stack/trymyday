import { Card, Button, Row, Col, Badge } from 'react-bootstrap';
import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileLayout from '../components/ProfileLayout';
import { useLanguage } from '../context/LanguageContext';

const Coupons = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Load coupons from localStorage
    const [coupons, setCoupons] = useState(() => {
        if (!user) return [];
        const saved = localStorage.getItem(`coupons_${user.email}`);
        return saved ? JSON.parse(saved) : [
            // Default coupons for demo
            {
                id: 1,
                code: 'BIENVENUE10',
                discount: 10,
                type: 'percentage',
                description: t('coupons.welcome_desc'),
                minAmount: 50,
                expiryDate: '2025-12-31',
                used: false
            },
            {
                id: 2,
                code: 'NOEL2025',
                discount: 20,
                type: 'percentage',
                description: t('coupons.xmas_desc'),
                minAmount: 100,
                expiryDate: '2025-12-25',
                used: false
            },
            {
                id: 3,
                code: 'LIVRAISON',
                discount: 0,
                type: 'shipping',
                description: t('coupons.free_shipping'),
                minAmount: 0,
                expiryDate: '2026-01-31',
                used: false
            }
        ];
    });

    const handleCopyCoupon = (code) => {
        navigator.clipboard.writeText(code);
        showToast(t('coupons.copy_success').replace('{code}', code), 'info');
    };

    const handleUseCoupon = (code) => {
        // Store coupon code in localStorage for cart to use
        localStorage.setItem('appliedCoupon', code);
        navigate('/cart');
    };

    const isExpired = (expiryDate) => {
        return new Date(expiryDate) < new Date();
    };

    const getDiscountText = (coupon) => {
        if (coupon.type === 'shipping') return t('coupons.free_shipping');
        if (coupon.type === 'percentage') return `-${coupon.discount}%`;
        return `-${coupon.discount.toLocaleString()} FCFA`;
    };

    const activeCoupons = coupons.filter(c => !c.used && !isExpired(c.expiryDate));
    const usedCoupons = coupons.filter(c => c.used);
    const expiredCoupons = coupons.filter(c => !c.used && isExpired(c.expiryDate));

    if (!user) {
        return (
            <ProfileLayout>
                <div className="mb-4">
                    <h3 className="fw-bold">{t('coupons.title')}</h3>
                    <p className="text-muted">{t('coupons.subtitle')}</p>
                </div>
                <Card className="border-0 shadow-sm text-center p-5">
                    <i className="bi bi-person-x" style={{ fontSize: '4rem', color: '#ddd' }}></i>
                    <h5 className="mt-3">{t('favorites_page.login_required')}</h5>
                    <p className="text-muted">{t('profile.login_prompt')}</p>
                    <Button variant="warning" className="text-white mt-2" onClick={() => navigate('/login')}>
                        {t('auth.login_btn')}
                    </Button>
                </Card>
            </ProfileLayout>
        );
    }

    return (
        <ProfileLayout>
            <div className="mb-4">
                <h3 className="fw-bold">{t('coupons.title')}</h3>
                <p className="text-muted">{t('coupons.subtitle_active')}</p>
            </div>

            {/* Active Coupons */}
            {activeCoupons.length > 0 && (
                <div className="mb-4">
                    <h5 className="fw-bold mb-3">{t('coupons.active_title')} ({activeCoupons.length})</h5>
                    <Row className="g-3">
                        {activeCoupons.map(coupon => (
                            <Col key={coupon.id} md={6} lg={4}>
                                <Card className="border-0 shadow-sm h-100" style={{
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    color: 'white'
                                }}>
                                    <Card.Body className="p-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <h4 className="fw-bold mb-0">{getDiscountText(coupon)}</h4>
                                                <small className="opacity-75" style={{ fontSize: '0.8rem' }}>{coupon.description}</small>
                                            </div>
                                            <i className="bi bi-ticket-perforated" style={{ fontSize: '1.5rem' }}></i>
                                        </div>

                                        <div className="bg-white bg-opacity-25 rounded p-2 mb-2">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <small className="opacity-75 d-block" style={{ fontSize: '0.7rem' }}>{t('cart.coupon_code')}</small>
                                                    <strong style={{ fontSize: '1rem', letterSpacing: '1px' }}>
                                                        {coupon.code}
                                                    </strong>
                                                </div>
                                                <Button
                                                    variant="light"
                                                    size="sm"
                                                    onClick={() => handleCopyCoupon(coupon.code)}
                                                    style={{ padding: '0.25rem 0.5rem' }}
                                                >
                                                    <i className="bi bi-clipboard"></i>
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="mb-2">
                                            {coupon.minAmount > 0 && (
                                                <small className="d-block opacity-75" style={{ fontSize: '0.75rem' }}>
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    {t('coupons.min_prefix')} {coupon.minAmount.toLocaleString()} FCFA
                                                </small>
                                            )}
                                            <small className="d-block opacity-75" style={{ fontSize: '0.75rem' }}>
                                                <i className="bi bi-calendar me-1"></i>
                                                {t('coupons.expiry_prefix')} {new Date(coupon.expiryDate).toLocaleDateString()}
                                            </small>
                                        </div>

                                        <Button
                                            variant="light"
                                            size="sm"
                                            className="w-100 fw-bold"
                                            onClick={() => handleUseCoupon(coupon.code)}
                                        >
                                            {t('coupons.use_btn')}
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            {/* Used Coupons */}
            {usedCoupons.length > 0 && (
                <div className="mb-4">
                    <h5 className="fw-bold mb-3">{t('coupons.used_title')} ({usedCoupons.length})</h5>
                    <Row className="g-3">
                        {usedCoupons.map(coupon => (
                            <Col key={coupon.id} md={6} lg={4}>
                                <Card className="border-0 shadow-sm h-100 bg-light">
                                    <Card.Body className="p-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <h6 className="fw-bold mb-1 text-muted">{getDiscountText(coupon)}</h6>
                                                <small className="text-muted" style={{ fontSize: '0.8rem' }}>{coupon.description}</small>
                                            </div>
                                            <Badge bg="secondary">Utilisé</Badge>
                                        </div>
                                        <div className="mt-2">
                                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>Code: {coupon.code}</small>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            {/* Expired Coupons */}
            {expiredCoupons.length > 0 && (
                <div className="mb-4">
                    <h5 className="fw-bold mb-3">{t('coupons.expired_title')} ({expiredCoupons.length})</h5>
                    <Row className="g-3">
                        {expiredCoupons.map(coupon => (
                            <Col key={coupon.id} md={6} lg={4}>
                                <Card className="border-0 shadow-sm h-100 bg-light">
                                    <Card.Body className="p-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <h6 className="fw-bold mb-1 text-muted">{getDiscountText(coupon)}</h6>
                                                <small className="text-muted" style={{ fontSize: '0.8rem' }}>{coupon.description}</small>
                                            </div>
                                            <Badge bg="danger">{t('coupons.expired_badge')}</Badge>
                                        </div>
                                        <div className="mt-2">
                                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                {t('cart.coupon_code')}: {coupon.code} • {t('coupons.expired_date_prefix')} {new Date(coupon.expiryDate).toLocaleDateString()}
                                            </small>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            {/* No coupons */}
            {activeCoupons.length === 0 && usedCoupons.length === 0 && expiredCoupons.length === 0 && (
                <Card className="border-0 shadow-sm text-center p-5">
                    <i className="bi bi-ticket-perforated" style={{ fontSize: '4rem', color: '#ddd' }}></i>
                    <h5 className="mt-3">{t('coupons.no_coupons')}</h5>
                    <p className="text-muted">{t('coupons.no_coupons_msg')}</p>
                    <Button variant="warning" className="text-white mt-2" onClick={() => navigate('/shop')}>
                        {t('orders.view_shop')}
                    </Button>
                </Card>
            )}
        </ProfileLayout>
    );
};

export default Coupons;
