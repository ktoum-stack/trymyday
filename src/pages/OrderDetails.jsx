import { Container, Row, Col, Card, Badge, Button, ListGroup, Modal, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import ProfileLayout from '../components/ProfileLayout';

const OrderDetails = () => {
    const { orderId } = useParams();
    const { orders, updateOrder } = useData();
    const { user } = useAuth();
    const { showToast, confirm } = useToast();
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Find the order
    const order = orders.find(o => o.id === orderId);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedItems, setSelectedItems] = useState({}); // { index: true/false }

    const handleCancelRequest = async (isFullOrder = false) => {
        let indicesToCancel = [];
        if (isFullOrder) {
            indicesToCancel = order.items.map((_, i) => i).filter(i => !order.items[i].cancelled && !order.items[i].cancelRequested);
        } else {
            indicesToCancel = Object.keys(selectedItems).filter(idx => selectedItems[idx]).map(Number);
        }

        if (indicesToCancel.length === 0) {
            showToast('Veuillez sélectionner au moins un article', 'warning');
            return;
        }

        const msg = isFullOrder ? "ANNULER TOUTE la commande ?" : `Annuler les ${indicesToCancel.length} article(s) sélectionné(s) ?`;
        const ok = await confirm({
            title: isFullOrder ? 'Annuler toute la commande' : 'Annuler la sélection',
            message: msg + " Un administrateur devra valider votre demande.",
            variant: 'danger',
            confirmText: 'Confirmer la demande'
        });

        if (ok) {
            const updatedItems = [...order.items];
            indicesToCancel.forEach(idx => {
                updatedItems[idx] = { ...updatedItems[idx], cancelRequested: true };
            });

            const allNowCancelled = updatedItems.every(i => i.cancelRequested || i.cancelled);
            const newStatus = allNowCancelled ? "Demande d'annulation" : order.status;

            const note = isFullOrder ? "L'utilisateur a demandé l'annulation totale." : `L'utilisateur a demandé l'annulation de ${indicesToCancel.length} article(s).`;

            const timelineEntry = {
                date: new Date().toLocaleString('fr-FR'),
                oldStatus: order.status,
                newStatus: newStatus,
                note: note,
                admin: "Client"
            };

            await updateOrder(order.id, {
                items: updatedItems,
                status: newStatus,
                timeline: [...(order.timeline || []), timelineEntry]
            });

            setShowCancelModal(false);
            setSelectedItems({});
            showToast('Demande envoyée avec succès', 'success');
        }
    };

    // Check if order exists and belongs to user
    if (!order) {
        return (
            <Container className="py-5 text-center">
                <h3>❌ {t('order_details.not_found')}</h3>
                <Button variant="warning" className="mt-3 text-white" onClick={() => navigate('/profile/orders')}>
                    ⬅️ {t('order_details.back')}
                </Button>
            </Container>
        );
    }

    if (order.email !== user?.email && user?.role !== 'admin') {
        return (
            <Container className="py-5 text-center">
                <h3>🔒 {t('order_details.unauthorized')}</h3>
                <Button variant="warning" className="mt-3 text-white" onClick={() => navigate('/profile/orders')}>
                    ⬅️ {t('order_details.back')}
                </Button>
            </Container>
        );
    }

    const getStatusBadge = (status) => {
        if (status === 'Livrée' || status === 'Complétée') return 'success';
        if (status === 'Annulée') return 'danger';
        if (status === 'En attente' || status === 'En cours') return 'warning';
        if (status === "Demande d'annulation") return 'warning';
        return 'info';
    };

    return (
        <ProfileLayout>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-1">{t('order_details.title')}</h3>
                    <p className="text-muted mb-0">{t('order_details.order_number')} #{order.id}</p>
                </div>
                <Button variant="outline-secondary" onClick={() => navigate('/profile/orders')}>
                    ⬅️ {t('order_details.back')}
                </Button>
            </div>

            <Row className="align-items-start">
                {/* Left Column - Order Info */}
                <Col lg={8}>
                    {/* Order Status */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-3">{t('order_details.status')}</h5>
                            {order.status === "Demande d'annulation" && (
                                <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center mb-4">
                                    <i className="bi bi-hourglass-split me-3 fs-4"></i>
                                    <div>
                                        <div className="fw-bold">{t('order_details.cancellation_progress')}</div>
                                        <small>{t('order_details.cancellation_notice')}</small>
                                    </div>
                                </div>
                            )}
                            <div className="d-flex align-items-center">
                                <Badge bg={getStatusBadge(order.status)} className="px-3 py-2 me-3">
                                    {order.status}
                                </Badge>
                                <div>
                                    <small className="text-muted d-block">{t('order_details.order_date')}</small>
                                    <strong>{order.date}</strong>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Tracking Timeline */}
                    {(order.trackingNumber || (order.timeline && order.timeline.length > 0)) && (
                        <Card className="border-0 shadow-sm mb-4">
                            <Card.Body className="p-4">
                                <h5 className="fw-bold mb-3">
                                    <i className="bi bi-clock-history me-2"></i>
                                    {t('order_details.tracking')}
                                </h5>

                                {order.trackingNumber && (
                                    <div className="alert alert-info mb-3">
                                        <i className="bi bi-truck me-2"></i>
                                        <strong>{t('order_details.tracking_number')}</strong> {order.trackingNumber}
                                    </div>
                                )}

                                {order.timeline && order.timeline.length > 0 && (
                                    <div className="timeline">
                                        {order.timeline.map((entry, index) => (
                                            <div key={index} className="timeline-item mb-4">
                                                <div className="d-flex">
                                                    <div className="me-3">
                                                        <div
                                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                backgroundColor:
                                                                    entry.newStatus === 'Livrée' ? '#198754' :
                                                                        entry.newStatus === 'En expédition' ? '#0dcaf0' :
                                                                            entry.newStatus === 'En cours' ? '#ffc107' :
                                                                                entry.newStatus === 'Annulée' ? '#dc3545' : '#6c757d',
                                                                color: 'white'
                                                            }}
                                                        >
                                                            <i className={`bi ${entry.newStatus === 'Livrée' ? 'bi-check-circle-fill' :
                                                                entry.newStatus === 'En expédition' ? 'bi-box-seam' :
                                                                    entry.newStatus === 'En cours' ? 'bi-truck' :
                                                                        entry.newStatus === 'Annulée' ? 'bi-x-circle-fill' : 'bi-clock-fill'
                                                                }`}></i>
                                                        </div>
                                                        {index < order.timeline.length - 1 && (
                                                            <div
                                                                className="ms-3"
                                                                style={{
                                                                    width: '2px',
                                                                    height: '60px',
                                                                    backgroundColor: '#dee2e6',
                                                                    marginTop: '5px'
                                                                }}
                                                            ></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                                            <div>
                                                                <strong>{entry.newStatus}</strong>
                                                                {entry.oldStatus && entry.oldStatus !== entry.newStatus && (
                                                                    <small className="text-muted ms-2">
                                                                        (de {entry.oldStatus})
                                                                    </small>
                                                                )}
                                                            </div>
                                                            <small className="text-muted">{entry.date}</small>
                                                        </div>
                                                        {entry.note && (
                                                            <div className="alert alert-light mb-0 mt-2 py-2 px-3">
                                                                <i className="bi bi-info-circle me-2"></i>
                                                                {entry.note}
                                                            </div>
                                                        )}
                                                        {entry.admin && (
                                                            <small className="text-muted">
                                                                <i className="bi bi-person-badge me-1"></i>
                                                                {entry.admin}
                                                            </small>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    )}

                    {/* Order Items */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-3">{t('order_details.items_ordered')} ({order.items?.length || 0})</h5>
                            <ListGroup variant="flush">
                                {order.items?.map((item, index) => (
                                    <ListGroup.Item key={index} className="px-0 py-3">
                                        <Row className="align-items-center">
                                            <Col xs="auto">
                                                <img
                                                    src={item.image || 'https://via.placeholder.com/80x80?text=Product'}
                                                    alt={item.name}
                                                    style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        objectFit: 'cover',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                            </Col>
                                            <Col>
                                                <h6 className="mb-1">{item.name}</h6>
                                                <small className="text-muted">{t('order_details.qty')} {item.quantity}</small>
                                            </Col>
                                            <Col xs="auto">
                                                <div className="text-end">
                                                    <strong className="text-warning d-block">{item.price.toLocaleString()} FCFA</strong>
                                                    <div className="small text-muted mb-2">
                                                        {t('order_details.total')} {(item.price * item.quantity).toLocaleString()} FCFA
                                                    </div>

                                                    {item.cancelRequested ? (
                                                        <Badge bg="warning" text="dark" className="d-block small">{t('order_details.cancel_requested')}</Badge>
                                                    ) : item.cancelled ? (
                                                        <Badge bg="danger" className="d-block small">{t('order_details.cancelled')}</Badge>
                                                    ) : null}
                                                </div>
                                            </Col>
                                        </Row>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>

                    {/* Shipping Address */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-3">{t('order_details.shipping_address')}</h5>
                            <div className="bg-light p-3 rounded">
                                <p className="mb-1"><strong>{order.customer}</strong></p>
                                <p className="mb-1 small">{order.shippingAddress?.address}</p>
                                <p className="mb-1 small">{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</p>
                                <p className="mb-1 small">{order.shippingAddress?.country}</p>
                                <p className="mb-1 small">{t('order_details.phone')} {order.phone}</p>
                                <p className="mb-0 small">{t('order_details.email')} {order.email}</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right Column - Summary */}
                <Col lg={4}>
                    <div className="sticky-top" style={{ top: '100px', zIndex: 10, transition: 'all 0.3s ease' }}>
                        <Card className="border-0 shadow-sm mb-3">
                            <Card.Body className="p-4">
                                <h5 className="fw-bold mb-4">{t('order_details.summary')}</h5>

                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">{t('order_details.subtotal')}</span>
                                    <span>{(order.total - (order.shippingCost || 0)).toLocaleString()} FCFA</span>
                                </div>

                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">{t('order_details.shipping')}</span>
                                    <span>{order.shippingCost ? `${order.shippingCost.toLocaleString()} FCFA` : t('order_details.free')}</span>
                                </div>

                                <hr />

                                <div className="d-flex justify-content-between mb-3">
                                    <strong>{t('order_details.total').replace(':', '')}</strong>
                                    <strong className="text-warning fs-5">{order.total.toLocaleString()} FCFA</strong>
                                </div>

                                <div className="bg-light p-3 rounded">
                                    <small className="text-muted d-block mb-1">{t('order_details.order_number')}</small>
                                    <strong className="small">{order.id}</strong>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Actions */}
                        <Card className="border-0 shadow-sm mt-3">
                            <Card.Body className="p-3">
                                {order.status === 'En attente' && (
                                    <Button
                                        variant="danger"
                                        className="w-100 mb-2"
                                        onClick={() => setShowCancelModal(true)}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        {t('order_details.manage_cancel')}
                                    </Button>
                                )}
                                <Button
                                    variant="outline-warning"
                                    className="w-100 mb-2"
                                    onClick={() => window.print()}
                                >
                                    <i className="bi bi-printer me-2"></i>
                                    {t('order_details.print')}
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    className="w-100"
                                    onClick={() => navigate('/shop')}
                                >
                                    <i className="bi bi-shop me-2"></i>
                                    {t('order_details.continue_shopping')}
                                </Button>
                            </Card.Body>
                        </Card>
                    </div>
                </Col>
            </Row>

            {/* Cancellation Modal */}
            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">{t('order_details.manage_cancel')}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    <p className="text-muted small mb-4">
                        {t('order_details.cancel_notice')}
                    </p>

                    <Button
                        variant="danger"
                        className="w-100 mb-4 py-2 fw-bold"
                        onClick={() => handleCancelRequest(true)}
                    >
                        <i className="bi bi-trash3 me-2"></i>
                        {t('order_details.cancel_all')}
                    </Button>

                    <div className="separator mb-4 d-flex align-items-center">
                        <hr className="flex-grow-1" />
                        <span className="mx-3 text-muted small fw-bold">{t('order_details.or_partial')}</span>
                        <hr className="flex-grow-1" />
                    </div>

                    <h6 className="fw-bold mb-3">{t('order_details.select_items')}</h6>
                    <ListGroup className="border-0 mb-4">
                        {order.items.map((item, idx) => {
                            const isAvailable = !item.cancelled && !item.cancelRequested;
                            return (
                                <ListGroup.Item
                                    key={idx}
                                    className={`px-0 border-0 ${!isAvailable ? 'opacity-50' : ''}`}
                                >
                                    <Form.Check
                                        type="checkbox"
                                        id={`item-${idx}`}
                                        disabled={!isAvailable}
                                        checked={selectedItems[idx] || false}
                                        onChange={(e) => setSelectedItems({ ...selectedItems, [idx]: e.target.checked })}
                                        label={
                                            <div className="ms-2">
                                                <div className="fw-bold small">{item.name}</div>
                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                    {item.price.toLocaleString()} FCFA
                                                    {item.cancelRequested && <span className="ms-2 text-warning">({t('order_details.cancel_requested')})</span>}
                                                    {item.cancelled && <span className="ms-2 text-danger">({t('order_details.cancelled')})</span>}
                                                </div>
                                            </div>
                                        }
                                    />
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>

                    <Button
                        variant="outline-danger"
                        className="w-100 py-2 fw-bold"
                        disabled={!Object.values(selectedItems).some(val => val)}
                        onClick={() => handleCancelRequest(false)}
                    >
                        {t('order_details.cancel_selected')}
                    </Button>
                </Modal.Body>
            </Modal>
        </ProfileLayout>
    );
};

export default OrderDetails;
