import { Container, Button, Card, Row, Col, Form, Alert, Badge, InputGroup, Offcanvas } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const Cart = () => {
    const { t } = useLanguage();
    const {
        cartItems,
        savedItems,
        appliedCoupon,
        removeFromCart,
        updateQuantity,
        clearCart,
        saveForLater,
        moveToCart,
        removeSavedItem,
        applyCoupon,
        removeCoupon,
        getCartTotal,
        selectedItems,
        toggleItemSelection,
        isItemSelected,
        getSubtotal: getContextSubtotal,
        getDiscount: getContextDiscount,
        getCartTotal: getContextTotal,
        getShippingCost
    } = useCart();

    const navigate = useNavigate();
    const { showToast, confirm } = useToast();

    // Local handlers for confirmation
    const handleRemoveFromCart = async (itemId) => {
        const ok = await confirm({
            title: t('cart.remove_item'),
            message: t('cart.remove_confirm'),
            variant: 'danger',
            confirmText: t('cart.remove_btn')
        });
        if (ok) {
            removeFromCart(itemId);
            showToast(t('cart.added_to_cart'), 'info'); // Wait, I should probably add a "Removed" key
        }
    };

    const handleClearCart = async () => {
        const ok = await confirm({
            title: t('cart.clear_cart'),
            message: t('cart.clear_confirm'),
            variant: 'danger',
            confirmText: t('cart.clear_btn')
        });
        if (ok) {
            clearCart();
            showToast(t('cart.clear_cart'), 'info');
        }
    };

    // Coupon input
    const [couponCode, setCouponCode] = useState('');
    const [showMobileDetails, setShowMobileDetails] = useState(false);

    // UI helpers using context with onlySelected=true
    const getSelectedSubtotal = () => getContextSubtotal(true);
    const getSelectedDiscount = () => getContextDiscount(true);
    const getSelectedTotal = () => getContextTotal(true);
    const getSelectedShippingCost = () => getShippingCost();

    // Handle coupon application
    const handleApplyCoupon = () => {
        if (!couponCode.trim()) {
            showToast(t('cart.enter_code'), 'warning');
            return;
        }

        const result = applyCoupon(couponCode);
        showToast(result.message, result.success ? 'success' : 'danger');

        if (result.success) {
            setCouponCode('');
        }
    };

    // Get estimated delivery date (3-5 business days)
    const getEstimatedDelivery = () => {
        const today = new Date();
        const deliveryDate = new Date(today);
        deliveryDate.setDate(today.getDate() + 5);
        return deliveryDate.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const isEmpty = cartItems.length === 0 && savedItems.length === 0;

    if (isEmpty) {
        return (
            <Container className="py-5 text-center">
                <div className="mb-4">
                    <i className="bi bi-cart-x" style={{ fontSize: '4rem', color: '#dee2e6' }}></i>
                </div>
                <h2>{t('cart.empty')}</h2>
                <p className="text-muted mb-4">{t('cart.empty_subtitle')}</p>
                <Button variant="warning" className="text-white fw-bold px-4 py-2" onClick={() => navigate('/shop')}>
                    {t('cart.back_to_shop')}
                </Button>
            </Container>
        );
    }

    return (
        <Container className="py-3 py-md-5 cart-container" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 fw-bold d-flex align-items-center">
                    <i className="bi bi-cart3 me-2 text-warning"></i>
                    {t('cart.title')} <span className="ms-2 text-muted fw-normal small">({cartItems.length} {cartItems.length > 1 ? t('cart.items_count') : t('cart.item_count')})</span>
                </h5>
                {cartItems.length > 0 && (
                    <Button
                        variant="link"
                        className="text-muted text-decoration-none small p-0 hover-text-danger transition-all"
                        onClick={handleClearCart}
                        style={{ fontSize: '0.8rem' }}
                    >
                        <i className="bi bi-trash3 me-1"></i>
                        {t('cart.clear_cart')}
                    </Button>
                )}
            </div>

            <Row className="g-4">
                <Col lg={8}>
                    {/* Cart Items List */}
                    {cartItems.length > 0 && (
                        <div className="d-flex flex-column gap-3 mb-4">
                            {cartItems.slice().sort((a, b) => (isItemSelected(b.id) ? 1 : 0) - (isItemSelected(a.id) ? 1 : 0)).map(item => (
                                <Card
                                    key={item.id}
                                    className="shadow-sm border-0 rounded-3 overflow-hidden cart-item-card"
                                    style={{
                                        opacity: isItemSelected(item.id) ? 1 : 0.5,
                                        transition: 'opacity 0.3s ease'
                                    }}
                                >
                                    <Card.Body className="p-0">
                                        <div className="d-flex p-2 p-md-3">
                                            {/* Checkbox for item selection */}
                                            <div className="d-flex align-items-center me-2">
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={isItemSelected(item.id)}
                                                    onChange={() => toggleItemSelection(item.id)}
                                                    style={{ transform: 'scale(1.2)' }}
                                                />
                                            </div>

                                            {/* Image */}
                                            <div 
                                                className="d-flex align-items-center me-3" 
                                                onClick={() => navigate(`/product/${item.id}`)} 
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div style={{ width: '65px', height: '80px', flexShrink: 0 }} className="cart-item-img-wrapper">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-100 h-100 rounded border"
                                                        style={{ objectFit: 'contain', padding: '4px' }}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Product Details */}
                                            <div className="flex-grow-1 d-flex flex-column justify-content-between" style={{ minWidth: 0 }}>
                                                <div className="d-flex justify-content-between align-items-start gap-2">
                                                    <div 
                                                        className="text-truncate" 
                                                        style={{ maxWidth: '70%', cursor: 'pointer' }}
                                                        onClick={() => navigate(`/product/${item.id}`)}
                                                    >
                                                        <h6 className="fw-bold mb-0 text-truncate" style={{ fontSize: '0.9rem' }} title={item.name}>{item.name}</h6>
                                                        <p className="text-muted mb-0 text-truncate" style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                                            {item.category}
                                                        </p>
                                                    </div>
                                                    <div className="text-end flex-shrink-0">
                                                        <span className="d-block fw-bold" style={{ fontSize: '0.95rem', color: '#ff6000' }}>
                                                            {((item.price * item.quantity)).toLocaleString()} FCFA
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions and Quantity */}
                                                <div className="d-flex justify-content-between align-items-center mt-2">
                                                    <div className="d-flex gap-3">
                                                        <Button
                                                            variant="link"
                                                            className="text-muted p-0 text-decoration-none hover-text-orange transition-all"
                                                            onClick={() => saveForLater(item.id)}
                                                        >
                                                            <i className="bi bi-bookmark fs-6"></i>
                                                        </Button>
                                                        <Button
                                                            variant="link"
                                                            className="text-muted p-0 text-decoration-none hover-text-danger transition-all"
                                                            onClick={() => handleRemoveFromCart(item.id)}
                                                        >
                                                            <i className="bi bi-trash fs-6"></i>
                                                        </Button>
                                                    </div>

                                                    <div className="d-flex align-items-center border rounded-pill px-2 py-0 bg-light" style={{ height: '32px' }}>
                                                        <Button
                                                            variant="link"
                                                            className="text-muted p-0 text-decoration-none d-flex align-items-center justify-content-center"
                                                            style={{ width: '20px', fontSize: '1.2rem' }}
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            disabled={item.quantity <= 1}
                                                        >−</Button>
                                                        <span className="mx-2 fw-bold" style={{ fontSize: '0.85rem', color: '#ff6000', minWidth: '15px', textAlign: 'center' }}>{item.quantity}</span>
                                                        <Button
                                                            variant="link"
                                                            className="text-muted p-0 text-decoration-none d-flex align-items-center justify-content-center"
                                                            style={{ width: '20px', fontSize: '1.2rem' }}
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        >+</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Saved Items Section */}
                    {savedItems.length > 0 && (
                        <Card className="shadow-sm border-0 rounded-3 mb-3">
                            <Card.Header className="bg-light border-0">
                                <h5 className="mb-0 fw-bold">
                                    <i className="bi bi-bookmark-fill me-2 text-primary"></i>
                                    {t('cart.saved_items')} ({savedItems.length})
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    {savedItems.map(item => (
                                        <Col md={6} key={item.id}>
                                            <div className="d-flex border rounded p-2">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    style={{ width: '60px', height: '60px', objectFit: 'contain', cursor: 'pointer' }}
                                                    className="me-2"
                                                    onClick={() => navigate(`/product/${item.id}`)}
                                                />
                                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                    <h6 
                                                        className="small mb-1 text-truncate" 
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => navigate(`/product/${item.id}`)}
                                                    >
                                                        {item.name}
                                                    </h6>
                                                    <p className="text-warning fw-bold small mb-2">{(item.price).toLocaleString()} FCFA</p>
                                                    <div className="d-flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline-primary"
                                                            onClick={() => moveToCart(item.id)}
                                                        >
                                                            <i className="bi bi-cart-plus me-1"></i>
                                                            {t('cart.add_to_cart')}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline-danger"
                                                            onClick={() => removeSavedItem(item.id)}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </Card.Body>
                        </Card>
                    )}

                    {cartItems.length > 0 && (
                        <div className="d-none d-md-flex justify-content-between align-items-center mt-3">
                            <Button variant="outline-secondary" size="sm" onClick={() => navigate('/shop')}>
                                <i className="bi bi-arrow-left me-1"></i>
                                {t('cart.continue_shopping')}
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={handleClearCart}>
                                <i className="bi bi-trash me-1"></i>
                                {t('cart.clear_cart')}
                            </Button>
                        </div>
                    )}
                </Col>

                {/* Order Summary */}
                {cartItems.length > 0 && (
                    <Col lg={4} className="d-none d-md-block">
                        <Card className="shadow-sm border-0">
                            <Card.Body className="p-4">
                                <h4 className="fw-bold mb-4">{t('cart.summary')}</h4>

                                {/* Coupon Section */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold small">{t('cart.coupon_code')}</label>
                                    {appliedCoupon ? (
                                        <div className="d-flex align-items-center justify-content-between bg-success bg-opacity-10 p-2 rounded">
                                            <div>
                                                <Badge bg="success" className="me-2">{appliedCoupon.code}</Badge>
                                                <small className="text-success">{appliedCoupon.description}</small>
                                            </div>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="text-danger p-0"
                                                onClick={removeCoupon}
                                            >
                                                <i className="bi bi-x-circle"></i>
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <InputGroup>
                                                <Form.Control
                                                    type="text"
                                                    placeholder={t('cart.enter_code')}
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                                />
                                                <Button variant="outline-warning" onClick={handleApplyCoupon}>
                                                    {t('cart.apply')}
                                                </Button>
                                            </InputGroup>
                                            <small className="text-muted d-block mt-1">
                                                Essayez: WELCOME10, SAVE20, FREESHIP
                                            </small>
                                        </>
                                    )}
                                </div>

                                <hr />

                                {/* Price Breakdown */}
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">{t('cart.subtotal')}</span>
                                    <span className="fw-bold">{(getSelectedSubtotal()).toLocaleString()} FCFA</span>
                                </div>


                                {getSelectedDiscount() > 0 && (
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-success">{t('cart.discount')}</span>
                                        <span className="text-success fw-bold">-{getSelectedDiscount().toLocaleString()} FCFA</span>
                                    </div>
                                )}


                                <hr className="my-3" />

                                <div className="d-flex justify-content-between mb-4 align-items-center">
                                    <span className="h5 fw-bold mb-0">{t('cart.total')}</span>
                                    <span className="h4 text-warning fw-bold mb-0">{(getSelectedTotal()).toLocaleString()} FCFA</span>
                                </div>

                                {/* Delivery Info */}
                                <div className="bg-light p-3 rounded mb-3">
                                    <small className="text-muted d-block mb-1">
                                        <i className="bi bi-truck me-2"></i>
                                        {t('cart.estimated_delivery')}
                                    </small>
                                    <small className="fw-bold">{getEstimatedDelivery()}</small>
                                </div>

                                <Button
                                    variant="warning"
                                    size="lg"
                                    className="w-100 text-white fw-bold py-3 shadow-sm rounded-3"
                                    onClick={() => {
                                        // Check if at least one item is selected
                                        const hasSelectedItems = Object.values(selectedItems).some(isSelected => isSelected);

                                        if (!hasSelectedItems) {
                                            showToast('Veuillez sélectionner au moins un article pour continuer', 'warning');
                                            return;
                                        }

                                        navigate('/checkout');
                                    }}
                                >
                                    {t('cart.checkout')}
                                    <i className="bi bi-chevron-right ms-2 small"></i>
                                </Button>

                                <div className="text-center mt-3">
                                    <small className="text-muted">
                                        <i className="bi bi-lock-fill me-1"></i>
                                        {t('cart.secure_payment')}
                                    </small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                )}
            </Row>

            {/* Mobile Sticky Checkout Bar */}
            {cartItems.length > 0 && (
                <>
                    <div className="d-md-none fixed-bottom bg-white border-top shadow-lg p-3" style={{ zIndex: 1010, bottom: '60px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2" onClick={() => setShowMobileDetails(true)} style={{ cursor: 'pointer' }}>
                            <div>
                                <span className="text-muted small d-flex align-items-center">
                                    {t('cart.total_to_pay')} <i className="bi bi-chevron-up ms-1"></i>
                                </span>
                                <div className="h5 text-warning fw-bold mb-0">{(getSelectedSubtotal() - getSelectedDiscount()).toLocaleString()} FCFA</div>
                            </div>
                            {appliedCoupon && (
                                <Badge bg="success">Code: {appliedCoupon.code}</Badge>
                            )}
                        </div>
                        <Button
                            variant="warning"
                            className="w-100 text-white fw-bold py-1 shadow-sm rounded-pill"
                            style={{ fontSize: '0.9rem' }}
                            onClick={() => {
                                const hasSelectedItems = Object.values(selectedItems).some(isSelected => isSelected);
                                if (!hasSelectedItems) {
                                    showToast('Veuillez sélectionner au moins un article pour continuer', 'warning');
                                    return;
                                }
                                navigate('/checkout');
                            }}
                        >
                            {t('cart.checkout')}
                        </Button>
                    </div>

                    {/* Mobile Details Offcanvas */}
                    <Offcanvas show={showMobileDetails} onHide={() => setShowMobileDetails(false)} placement="bottom" className="h-auto border-top-0 rounded-top-4">
                        <Offcanvas.Header closeButton>
                            <Offcanvas.Title className="fw-bold">{t('cart.order_details')}</Offcanvas.Title>
                        </Offcanvas.Header>
                        <Offcanvas.Body>
                            <div className="mb-4">
                                <h6 className="fw-bold mb-3">{t('cart.selected_items')}</h6>
                                {cartItems.filter(item => isItemSelected(item.id)).map(item => (
                                    <div key={item.id} className="d-flex align-items-center mb-2 pb-2 border-bottom border-light">
                                        <img 
                                            src={item.image} 
                                            alt={item.name} 
                                            style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
                                            className="me-3 border rounded p-1 bg-white" 
                                        />
                                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                            <div className="small fw-bold text-truncate">{item.name}</div>
                                            <div className="extra-small text-muted">{item.quantity} x {item.price.toLocaleString()} FCFA</div>
                                        </div>
                                        <div className="small fw-bold text-nowrap ms-2">
                                            {(item.price * item.quantity).toLocaleString()} FCFA
                                        </div>
                                    </div>
                                ))}
                                {cartItems.filter(item => isItemSelected(item.id)).length === 0 && (
                                    <div className="text-center py-3 text-muted small">
                                        {t('cart.no_items_selected')}
                                    </div>
                                )}
                            </div>

                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">{t('cart.subtotal')}</span>
                                <span className="fw-bold">{(getSelectedSubtotal()).toLocaleString()} FCFA</span>
                            </div>

                            {getSelectedDiscount() > 0 && (
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-success">{t('cart.discount')}</span>
                                    <span className="text-success fw-bold">-{getSelectedDiscount().toLocaleString()} FCFA</span>
                                </div>
                            )}
                            <hr />
                            <div className="d-flex justify-content-between mb-4 align-items-center">
                                <span className="h5 fw-bold mb-0">{t('cart.total')}</span>
                                <span className="h4 text-warning fw-bold mb-0">{(getSelectedSubtotal() - getSelectedDiscount()).toLocaleString()} FCFA</span>
                            </div>
                            
                            {/* Coupon input for mobile */}
                            <div className="mb-2">
                                <label className="form-label fw-bold small">{t('cart.coupon_code')}</label>
                                {appliedCoupon ? (
                                    <div className="d-flex align-items-center justify-content-between bg-success bg-opacity-10 p-2 rounded">
                                        <div>
                                            <Badge bg="success" className="me-2">{appliedCoupon.code}</Badge>
                                            <small className="text-success">{appliedCoupon.description}</small>
                                        </div>
                                        <Button variant="link" size="sm" className="text-danger p-0" onClick={removeCoupon}>
                                            <i className="bi bi-x-circle"></i>
                                        </Button>
                                    </div>
                                ) : (
                                    <InputGroup>
                                        <Form.Control
                                            type="text"
                                            placeholder={t('cart.enter_code')}
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        />
                                        <Button variant="outline-warning" onClick={handleApplyCoupon}>
                                            {t('cart.apply')}
                                        </Button>
                                    </InputGroup>
                                )}
                            </div>
                        </Offcanvas.Body>
                    </Offcanvas>
                </>
            )}

            <style>{`
                @media (max-width: 767.98px) {
                    .cart-container {
                        padding-bottom: 200px !important;
                    }
                    .cart-item-img-wrapper {
                        width: 65px !important;
                        height: 65px !important;
                    }
                    .cart-item-card .d-flex.p-3 {
                        padding: 0.8rem !important;
                    }
                    .cart-item-card {
                        transition: all 0.3s ease;
                        border-radius: 12px !important;
                    }
                    .cart-item-card:hover {
                        transform: translateY(-2px);
                        shadow: 0 4px 12px rgba(0,0,0,0.08);
                    }
                    .transition-all {
                        transition: all 0.2s ease;
                    }
                    .hover-text-orange:hover {
                        color: #ff6000 !important;
                    }
                    .hover-text-danger:hover {
                        color: #dc3545 !important;
                    }
                }
            `}</style>
        </Container>
    );
};

export default Cart;
