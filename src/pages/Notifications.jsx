import { useState, useEffect } from 'react';
import { Card, ListGroup, Badge, Button, Nav, Tab } from 'react-bootstrap';
import ProfileLayout from '../components/ProfileLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../config';

const Notifications = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch notifications from the real backend
    const fetchNotifications = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const response = await authFetch(`${API_BASE_URL}/api/notifications/${user.id}`);
            const data = await response.json();
            if (data.success) {
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [user?.id]);

    const markAsRead = async (id) => {
        try {
            // Optimistic UI update: Remove from list immediately
            setNotifications(prev => prev.filter(n => n.id !== id));
            
            await authFetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
                method: 'PUT'
            });
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
            // Re-fetch to sync if failed
            fetchNotifications();
        }
    };

    const markAllAsRead = async () => {
        if (!user?.id) return;
        try {
            setNotifications([]); // Optimistic update
            await authFetch(`${API_BASE_URL}/api/notifications/user/${user.id}/read-all`, {
                method: 'PUT'
            });
        } catch (error) {
            console.error("Failed to mark all as read:", error);
            fetchNotifications();
        }
    };

    const deleteNotification = async (id) => {
        try {
            setNotifications(prev => prev.filter(n => n.id !== id));
            await authFetch(`${API_BASE_URL}/api/notifications/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error("Failed to delete notification:", error);
            fetchNotifications();
        }
    };

    const getIconInfo = (type) => {
        switch (type) {
            case 'order': return { icon: 'bi-truck', color: '#ff6000' };
            case 'promo': return { icon: 'bi-lightning-fill', color: '#dc3545' };
            default: return { icon: 'bi-shield-check', color: '#0d6efd' };
        }
    };

    const getIconStyle = (color) => ({
        width: '45px',
        height: '45px',
        borderRadius: '12px',
        backgroundColor: `${color}15`,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        flexShrink: 0
    });

    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now - date;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        
        if (diffInHours < 1) return t('notifications.just_now');
        if (diffInHours < 24) return t('notifications.hours_ago').replace('{hours}', diffInHours);
        return date.toLocaleDateString();
    };

    if (!user) {
        return (
            <ProfileLayout>
                <Card className="border-0 shadow-sm text-center p-5 rounded-4">
                    <div className="mb-4">
                        <i className="bi bi-bell-slash text-muted" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h4 className="fw-bold">{t('notifications.login_required')}</h4>
                    <p className="text-muted mb-4">{t('notifications.login_msg')}</p>
                    <div className="d-flex justify-content-center gap-2">
                        <Button variant="warning" className="text-white px-4 py-2 rounded-pill fw-bold" onClick={() => navigate('/login')}>
                            {t('notifications.login_btn')}
                        </Button>
                        <Button variant="outline-dark" className="px-4 py-2 rounded-pill fw-bold" onClick={() => navigate('/')}>
                            {t('notifications.back_home')}
                        </Button>
                    </div>
                </Card>
            </ProfileLayout>
        );
    }

    const NotificationItem = ({ item }) => {
        const { icon, color } = getIconInfo(item.type);
        return (
            <ListGroup.Item 
                className={`border-0 border-bottom p-3 transition-all notification-item bg-light-orange shadow-sm`}
                style={{ 
                    cursor: 'pointer',
                    backgroundColor: '#fff9f4',
                    borderRadius: '12px',
                    margin: '8px 0'
                }}
                onClick={() => markAsRead(item.id)}
            >
                <div className="d-flex align-items-start gap-3">
                    <div style={getIconStyle(color)}>
                        <i className={`bi ${icon}`}></i>
                    </div>
                    <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <h6 className="mb-0 fw-bold">{item.title}</h6>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>{formatRelativeTime(item.date)}</small>
                        </div>
                        <p className="mb-0 text-muted small" style={{ lineHeight: '1.4' }}>{item.message}</p>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-2">
                       <Badge bg="warning" pill className="p-1 border border-white" style={{ width: '8px', height: '8px' }}></Badge>
                       <Button 
                            variant="link" 
                            className="p-0 text-muted hover-red" 
                            onClick={(e) => { e.stopPropagation(); deleteNotification(item.id); }}
                        >
                            <i className="bi bi-x fs-5"></i>
                       </Button>
                    </div>
                </div>
            </ListGroup.Item>
        );
    };

    const NotificationList = ({ type }) => {
        // As per request "disparaître après avoir lu", we only show unread notifications
        // Note: The backend already filters for !isRead, but we filter again here for safety
        const filtered = notifications.filter(n => !n.isRead && (type === 'all' || n.type === type));

        if (loading) {
            return <div className="text-center py-5"><div className="spinner-border text-warning" role="status"></div></div>;
        }

        if (filtered.length === 0) {
            return (
                <div className="text-center py-5">
                    <i className="bi bi-inbox text-muted opacity-25" style={{ fontSize: '4rem' }}></i>
                    <p className="text-muted mt-3">{t('notifications.empty')}</p>
                </div>
            );
        }

        return (
            <ListGroup variant="flush">
                {filtered.map(item => (
                    <NotificationItem key={item.id} item={item} />
                ))}
            </ListGroup>
        );
    };

    return (
        <ProfileLayout>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-800 mb-1">{t('notifications.title')}</h3>
                    <p className="text-muted small mb-0">{t('notifications.subtitle')}</p>
                </div>
                {notifications.length > 0 && (
                    <Button 
                        variant="link" 
                        className="text-warning text-decoration-none fw-bold small p-0"
                        onClick={markAllAsRead}
                    >
                        {t('notifications.mark_all_read')}
                    </Button>
                )}
            </div>

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Tab.Container defaultActiveKey="all">
                    <Card.Header className="bg-white border-bottom p-0">
                        <Nav variant="tabs" className="nav-justified border-0">
                            <Nav.Item>
                                <Nav.Link eventKey="all" className="py-3 border-0 transition-all fw-bold small text-uppercase">{t('notifications.tab_all')}</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="order" className="py-3 border-0 transition-all fw-bold small text-uppercase">{t('notifications.tab_orders')}</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="promo" className="py-3 border-0 transition-all fw-bold small text-uppercase">{t('notifications.tab_promos')}</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="system" className="py-3 border-0 transition-all fw-bold small text-uppercase">{t('notifications.tab_system')}</Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Tab.Content>
                            <Tab.Pane eventKey="all">
                                <NotificationList type="all" />
                            </Tab.Pane>
                            <Tab.Pane eventKey="order">
                                <NotificationList type="order" />
                            </Tab.Pane>
                            <Tab.Pane eventKey="promo">
                                <NotificationList type="promo" />
                            </Tab.Pane>
                            <Tab.Pane eventKey="system">
                                <NotificationList type="system" />
                            </Tab.Pane>
                        </Tab.Content>
                    </Card.Body>
                </Tab.Container>
            </Card>

            <style>{`
                .nav-link {
                    color: #6c757d;
                    border-bottom: 2px solid transparent !important;
                }
                .nav-link.active {
                    color: #ff6000 !important;
                    background: transparent !important;
                    border-bottom: 2px solid #ff6000 !important;
                }
                .notification-item {
                    transition: all 0.2s ease;
                }
                .notification-item:hover {
                    background-color: #fcece0;
                    transform: translateX(5px);
                }
                .hover-red:hover {
                    color: #dc3545 !important;
                }
                .fw-800 { font-weight: 800; }
                .bg-light-orange { background-color: #fff9f4; }
            `}</style>
        </ProfileLayout>
    );
};

export default Notifications;


// Auto-Injected fetch wrapper for JWT
const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (token && url.includes('/api/')) {
        options.headers = {
            ...options.headers,
            'Authorization': 'Bearer ' + token,
        };
    }
    return fetch(url, options);
};
