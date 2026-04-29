import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Badge, Modal, Button, Offcanvas } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useWallet } from '../context/WalletContext';

const ProfileLayout = ({ children }) => {
    const { user, logout, updateUser } = useAuth();
    const [showBalance, setShowBalance] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const navigate = useNavigate();
    const { t } = useLanguage();
    const location = useLocation();
    const { balance } = useWallet();
    const [notificationsCount, setNotificationsCount] = useState(0);

    const fetchProfileNotifications = async () => {
        if (!user?.id) return;
        try {
            const API_BASE_URL = (await import('../config')).default;
            const response = await authFetch(`${API_BASE_URL}/api/notifications/${user.id}`);
            const data = await response.json();
            if (data.success) {
                setNotificationsCount(data.notifications.length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications in ProfileLayout:", error);
        }
    };

    useEffect(() => {
        if (user) fetchProfileNotifications();
    }, [user?.id]);

    // Liste d'avatars disponibles
    const availableAvatars = [
        '👤', '👨', '👩', '🧑', '👦', '👧',
        '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '👨‍🔧', '👩‍🔧',
        '👨‍⚕️', '👩‍⚕️', '👨‍🍳', '👩‍🍳', '👨‍🎨', '👩‍🎨',
        '🦸‍♂️', '🦸‍♀️', '🧙‍♂️', '🧙‍♀️', '🧛‍♂️', '🧛‍♀️',
        '😎', '🤙', '✌️', '🤘', '🤝',
        '💪', '🦾', '🧠', '❤️‍🔥', '💯', '🔥',
        '⚡', '💎', '👑', '🎯', '🏆', '⭐',
        '🎸', '🎧', '🎤', '🎮', '🏀', '⚽',
        '🛹', '🏍️', '🚀', '💰', '💵', '🎰',
        '😏', '😈', '🤩', '🥶', '🤑', '🥳',
        '🤠', '🤓', '🧐', '😇', '🤯', '😤',
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊',
        '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
        '🦅', '🦉', '🐺', '🦈',
        '🎃', '🤖', '👽', '👾', '🎭', '🎨',
        '☠️', '👻', '💀', '🎲', '🃏', '🌟'
    ];

    const handleAvatarSelect = (avatar) => {
        // Mettre à jour l'avatar de l'utilisateur
        const updatedUser = { ...user, avatar };
        updateUser(updatedUser);

        // Mettre à jour dans la liste des utilisateurs
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.map(u =>
            u.email === user.email ? updatedUser : u
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));

        setShowAvatarModal(false);
    };

    const menuSections = [
        {
            title: t('profile.my_orders'),
            items: [
                { icon: 'bi-box-seam', label: t('profile.all_orders'), link: '/profile/orders', badge: null },
                { icon: 'bi-arrow-repeat', label: t('profile.reorder'), link: '/profile/reorder', badge: null },
            ]
        },
        {
            title: t('profile.wallet_coupons'),
            items: [
                { icon: 'bi-wallet2', label: t('profile.wallet'), link: '/profile/wallet', badge: null },
                { icon: 'bi-ticket-perforated', label: t('profile.coupons'), link: '/profile/coupons', badge: null },
                { icon: 'bi-bell', label: t('profile.notifications'), link: '/notifications', badge: notificationsCount > 0 ? notificationsCount.toString() : null },
            ]
        },
        {
            title: t('profile.account_help'),
            items: [
                { icon: 'bi-person', label: t('profile.user_info'), link: '/profile/info', badge: null },
                { icon: 'bi-geo-alt', label: t('profile.addresses'), link: '/profile/addresses', badge: null },
                { icon: 'bi-credit-card-2-front', label: t('profile.saved_cards'), link: '/profile/cards', badge: null },
                { icon: 'bi-shield-lock', label: t('profile.privacy'), link: '/profile/privacy', badge: null },
                { icon: 'bi-toggles', label: t('profile.active_settings'), link: '/profile/settings', badge: null },
                { icon: 'bi-question-circle', label: t('profile.help'), link: '/help', badge: null },
            ]
        }
    ];

    const SidebarContent = () => (
        <div className="profile-sidebar-container">
            <Card className="border-0 mb-3 overflow-hidden" style={{
                background: 'linear-gradient(135deg,  #f39d48ff 0%, #f6ce93ff 100%)',
                boxShadow: '0 4px 15px rgba(236, 144, 87, 0.4)',
                borderRadius: '12px'
            }}>
                <Card.Body className="py-3 px-3">
                    <div className="text-center mb-3">
                        <div
                            className="mx-auto mb-2"
                            onClick={() => setShowAvatarModal(true)}
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                border: '3px solid rgba(255, 255, 255, 0.3)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                position: 'relative'
                            }}
                        >
                            {user?.avatar || '👤'}
                            <i className="bi bi-pencil-fill" style={{
                                position: 'absolute', bottom: '0', right: '0', fontSize: '0.5rem',
                                color: 'white', background: 'rgba(0, 0, 0, 0.5)', borderRadius: '50%',
                                padding: '3px', width: '16px', height: '16px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center'
                            }}></i>
                        </div>
                        <h6 className="mb-0 fw-bold text-truncate text-dark" style={{ fontSize: '0.9rem' }}>
                            {user?.name}
                        </h6>
                    </div>

                    <div className="d-flex flex-column gap-2">
                        <div className="d-flex align-items-center justify-content-between p-2" style={{
                            background: 'rgba(255, 255, 255, 0.15)', borderRadius: '8px', backdropFilter: 'blur(10px)'
                        }}>
                            <small className="text-truncate fw-bold text-dark" style={{ fontSize: '0.7rem' }}>
                                {t('profile.id')}: {user?.id}
                            </small>
                        </div>

                        <div className="d-flex align-items-center justify-content-between p-2" style={{
                            background: 'rgba(255, 255, 255, 0.25)', borderRadius: '8px', backdropFilter: 'blur(10px)'
                        }}>
                            <div className="d-flex align-items-center" style={{ minWidth: 0, flex: 1 }}>
                                <i className="bi bi-wallet2 me-2 text-dark" style={{ fontSize: '0.8rem' }}></i>
                                <small className="text-truncate fw-bold text-dark" style={{ fontSize: '0.75rem' }}>
                                    {showBalance ? `${(balance !== undefined ? balance : 0).toLocaleString()} FCFA` : '---'}
                                </small>
                            </div>
                            <i
                                className={`bi bi-eye${showBalance ? '-slash' : ''} text-dark`}
                                style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                                onClick={() => setShowBalance(!showBalance)}
                            ></i>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {menuSections.map((section, idx) => (
                <Card key={idx} className="shadow-sm border-0 mb-3 overflow-hidden">
                    <Card.Body className="p-0">
                        <div className="px-3 py-2 border-bottom bg-light">
                            <h6 className="mb-0 fw-bold text-muted" style={{ fontSize: '0.7rem' }}>
                                {section.title}
                            </h6>
                        </div>
                        <ListGroup variant="flush">
                            {section.items.map((item, itemIdx) => (
                                <ListGroup.Item
                                    key={itemIdx}
                                    as={Link}
                                    to={item.link}
                                    action
                                    active={location.pathname === item.link}
                                    className="border-0 d-flex align-items-center justify-content-between py-2 transition-all hover-bg-light"
                                    onClick={() => setShowMobileMenu(false)}
                                >
                                    <div className="d-flex align-items-center">
                                        <i className={`${item.icon} me-2`} style={{ fontSize: '0.9rem', color: location.pathname === item.link ? '#fff' : '#ff6000' }}></i>
                                        <span style={{ fontSize: '0.8rem' }}>{item.label}</span>
                                    </div>
                                    {item.badge && (
                                        <Badge bg="danger" className="font-size-xs rounded-pill" style={{ padding: '0.3em 0.5em' }}>
                                            {item.badge}
                                        </Badge>
                                    )}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Card.Body>
                </Card>
            ))}

            <Card className="shadow-sm border-0 mb-4 overflow-hidden">
                <ListGroup variant="flush">
                    <ListGroup.Item
                        action
                        className="border-0 text-danger d-flex align-items-center py-2 hover-bg-light"
                        onClick={logout}
                        style={{ cursor: 'pointer' }}
                    >
                        <i className="bi bi-box-arrow-right me-2" style={{ fontSize: '1rem' }}></i>
                        <span className="fw-bold" style={{ fontSize: '0.8rem' }}>{t('profile.logout_btn')}</span>
                    </ListGroup.Item>
                </ListGroup>
            </Card>
        </div>
    );

    return (
        <Container className="py-2 py-md-4 position-relative" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', maxWidth: '1200px' }}>
            <Row>
                {/* New Mobile Header with Back Button and Menu Trigger */}
                <div className="d-md-none sticky-top bg-white border-bottom shadow-sm px-3 py-2 mb-3 mx-n2" style={{ zIndex: 1020, top: 0 }}>
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            {location.pathname !== '/profile' && (
                                <Button 
                                    variant="link" 
                                    className="p-0 me-3 text-dark text-decoration-none d-flex align-items-center justify-content-center bg-light rounded-circle" 
                                    onClick={() => navigate('/profile')}
                                    style={{ width: '38px', height: '38px' }}
                                >
                                    <i className="bi bi-chevron-left fs-5"></i>
                                </Button>
                            )}
                            <h6 className="mb-0 fw-bold text-dark text-truncate">
                                {location.pathname.startsWith('/profile/orders') ? t('profile.my_orders') : 
                                 location.pathname.startsWith('/profile/wallet') ? t('profile.wallet_short') :
                                 location.pathname.startsWith('/profile/info') ? t('profile.title') : 
                                 location.pathname.startsWith('/profile/addresses') ? t('profile.addresses') :
                                 location.pathname === '/profile' ? t('profile.my_account') : t('profile.profile_title')}
                            </h6>
                        </div>
                    </div>
                </div>

                {/* Sidebar Desktop */}
                <Col lg={2} md={3} className="d-none d-md-block">
                    <SidebarContent />
                </Col>

                {/* Content Area */}
                <Col lg={10} md={9} className="profile-content-col">
                    {children}
                </Col>
            </Row>

            {/* Modal de sélection d'avatar */}
            <Modal show={showAvatarModal} onHide={() => setShowAvatarModal(false)} centered>
                <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #f39d48ff 0%, #f6ce93ff 100%)', color: 'white', border: 'none' }}>
                    <Modal.Title style={{ fontSize: '1.1rem' }}>
                        <i className="bi bi-emoji-smile me-2"></i>
                        {t('profile.choose_avatar')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        gap: '10px',
                        padding: '10px'
                    }}>
                        {availableAvatars.map((avatar, index) => (
                            <div
                                key={index}
                                onClick={() => handleAvatarSelect(avatar)}
                                style={{
                                    fontSize: '2rem',
                                    padding: '10px',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.2s ease',
                                    border: user?.avatar === avatar ? '3px solid #f39d48ff' : '2px solid #e0e0e0',
                                    background: user?.avatar === avatar ? 'rgba(243, 157, 72, 0.1)' : 'white'
                                }}
                                onMouseEnter={(e) => {
                                    if (user?.avatar !== avatar) {
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                        e.currentTarget.style.background = '#f5f5f5';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (user?.avatar !== avatar) {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.background = 'white';
                                    }
                                }}
                            >
                                {avatar}
                            </div>
                        ))}
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ border: 'none' }}>
                    <Button variant="secondary" size="sm" onClick={() => setShowAvatarModal(false)}>
                        {t('common.cancel')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container >
    );
};

export default ProfileLayout;


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
