import { useState } from 'react';
import { Container, Row, Col, Card, ListGroup, Badge, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import ProfileLayout from '../components/ProfileLayout';
import { useLanguage } from '../context/LanguageContext';

const Orders = () => {
    const { user } = useAuth();
    const { orders } = useData();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const getStatusLabel = (status) => {
        if (status === 'Livrée') return t('orders.status_delivered');
        if (status === 'Complétée') return t('orders.status_completed');
        if (status === 'Annulée') return t('orders.status_cancelled');
        if (status === 'En expédition') return t('orders.status_shipping');
        if (status === 'En attente') return t('orders.status_pending');
        if (status === 'En cours') return t('orders.status_processing');
        if (status === "Demande d'annulation") return t('orders.status_cancel_request');
        return status;
    };

    // Filter orders by user email
    const userOrders = orders.filter(order => order.email === user?.email);

    const getStatusIcon = (status) => {
        if (status === 'Livrée' || status === 'Complétée') return 'bi bi-check-circle-fill text-success';
        if (status === 'Annulée') return 'bi bi-x-circle-fill text-danger';
        if (status === 'En expédition') return 'bi bi-box-seam text-info';
        if (status === 'En attente' || status === 'En cours') return 'bi bi-clock-fill text-warning';
        if (status === "Demande d'annulation") return 'bi bi-hourglass-split text-warning';
        return 'bi bi-box-seam text-secondary';
    };

    if (!user) {
        return (
            <Container className="py-5 text-center">
                <h3>{t('profile.login_prompt')}</h3>
                <Link to="/login" state={{ from: '/profile/orders' }} className="btn btn-warning text-white rounded-pill px-5 fw-bold shadow-sm">
                    {t('auth.login_btn')}
                </Link>
            </Container>
        );
    }

    return (
        <ProfileLayout>
            <div className="mb-3 pt-1">
                <h5 className="fw-bolder mb-0 text-dark">{t('orders.title')}</h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>{t('orders.subtitle')}</p>
            </div>

            {userOrders.length === 0 ? (
                <Card className="shadow-sm border-0 text-center p-5">
                    <i className="bi bi-box-seam" style={{ fontSize: '5rem', color: '#ddd' }}></i>
                    <h4 className="mt-4 text-muted">{t('orders.no_orders')}</h4>
                    <p className="text-muted">{t('orders.no_orders_msg')}</p>
                    <Button variant="warning" className="text-white mt-3" onClick={() => navigate('/shop')}>
                        {t('orders.view_shop')}
                    </Button>
                </Card>
            ) : (
                <>
                    {/* Active Orders Section */}
                    {userOrders.filter(order => order.status !== 'Livrée' && order.status !== 'Annulée').length > 0 && (
                        <Card className="shadow-sm border-0 mb-4">
                            <Card.Header className="bg-white border-bottom p-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h6 className="mb-0 fw-bold">
                                        <i className="bi bi-clock-history text-warning me-2"></i>
                                        {t('orders.active_orders')}
                                    </h6>
                                    <Badge bg="warning" text="dark">
                                        {userOrders.filter(order => order.status !== 'Livrée' && order.status !== 'Annulée').length}
                                    </Badge>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <ListGroup variant="flush">
                                    {userOrders.filter(order => order.status !== 'Livrée' && order.status !== 'Annulée').map(order => (
                                        <ListGroup.Item key={order.id} className="hover-bg-light transition-all cursor-pointer border-bottom px-3 py-2 bg-white" onClick={() => navigate(`/profile/orders/${order.id}`)}>
                                            <div className="d-flex align-items-start justify-content-between">
                                                <div className="d-flex flex-column">
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <i className={`${getStatusIcon(order.status)} font-size-sm`}></i>
                                                        <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{t('orders.order_prefix')}{order.id.substring(0, 6)}</span>
                                                    </div>
                                                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                        {order.date} • {order.items?.length || 0} {t('orders.items_suffix')}
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bolder text-dark mb-1" style={{ fontSize: '0.9rem' }}>{order.total.toLocaleString()} FCFA</div>
                                                    <Badge bg={
                                                        order.status === 'En expédition' ? 'info' :
                                                            order.status === 'En cours' ? 'warning' :
                                                                order.status === 'En attente' ? 'secondary' :
                                                                    order.status === "Demande d'annulation" ? 'warning' :
                                                                        order.status === 'Annulée' ? 'danger' : 'primary'
                                                    } className="py-1 px-2 border-0" style={{ fontSize: '0.65rem', borderRadius: '4px' }}>
                                                        {getStatusLabel(order.status)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Delivered & Cancelled Orders Section */}
                    {userOrders.filter(order => order.status === 'Livrée' || order.status === 'Annulée').length > 0 && (
                        <Card className="shadow-sm border-0">
                            <Card.Header className="bg-white border-bottom p-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h6 className="mb-0 fw-bold">
                                        <i className="bi bi-clock-history text-secondary me-2"></i>
                                        {t('orders.order_history')}
                                    </h6>
                                    <Badge bg="secondary">
                                        {userOrders.filter(order => order.status === 'Livrée' || order.status === 'Annulée').length}
                                    </Badge>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <ListGroup variant="flush">
                                    {userOrders.filter(order => order.status === 'Livrée' || order.status === 'Annulée').map(order => (
                                        <ListGroup.Item key={order.id} className="hover-bg-light transition-all cursor-pointer border-bottom px-3 py-2 bg-light bg-opacity-25" onClick={() => navigate(`/profile/orders/${order.id}`)}>
                                            <div className="d-flex align-items-start justify-content-between">
                                                <div className="d-flex flex-column">
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <i className={`font-size-sm ${order.status === 'Annulée' ? 'bi bi-x-circle-fill text-danger' : 'bi bi-check-circle-fill text-success'}`}></i>
                                                        <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{t('orders.order_prefix')}{order.id.substring(0, 6)}</span>
                                                    </div>
                                                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                        {order.date} • {order.items?.length || 0} {t('orders.art_suffix')}
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bolder text-dark mb-1" style={{ fontSize: '0.9rem' }}>{order.total.toLocaleString()} FCFA</div>
                                                    <Badge bg={order.status === 'Annulée' ? 'danger' : 'success'} className="py-1 px-2 border-0" style={{ fontSize: '0.65rem', borderRadius: '4px' }}>
                                                        {getStatusLabel(order.status)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    )}
                </>
            )}
        </ProfileLayout>
    );
};

export default Orders;
