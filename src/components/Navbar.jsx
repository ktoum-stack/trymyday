import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Badge, Nav, InputGroup, Button, NavDropdown, Offcanvas, ListGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useData, CATEGORIES } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useState, useRef, useEffect } from 'react';
import API_BASE_URL from '../config';

import { useCart } from '../context/CartContext';

const Navigation = () => {
    const { user, logout } = useAuth();
    const { getCartCount } = useCart();
    const { language, setLanguage, t } = useLanguage();
    const { products } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [activeSidebarCat, setActiveSidebarCat] = useState('Femme');
    const [showSidebarMenu, setShowSidebarMenu] = useState(false);
    const [showMobileNav, setShowMobileNav] = useState(false);
    const navigate = useNavigate();
    const menuRef = useRef(null);
    const [notifications, setNotifications] = useState([]);

    const fetchHeaderNotifications = async () => {
        if (!user?.id) return;
        try {
            const response = await authFetch(`${API_BASE_URL}/api/notifications/${user.id}`);
            const data = await response.json();
            if (data.success) {
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    useEffect(() => {
        if (user) fetchHeaderNotifications();
    }, [user?.id]);

    const handleReadNotification = async (id) => {
        try {
            setNotifications(prev => prev.filter(n => n.id !== id));
            await authFetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
                method: 'PUT'
            });
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowSidebarMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);



    // Update search suggestions when typing
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchSuggestions([]);
            return;
        }

        const term = searchTerm.toLowerCase();
        const matches = products.filter(p =>
            p.name?.toLowerCase().includes(term) ||
            p.category?.toLowerCase().includes(term) ||
            p.brand?.toLowerCase().includes(term)
        );
        setSearchSuggestions(matches);
    }, [searchTerm, products]);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm('');
            setShowMobileNav(false);
        }
    };

    return (
        <header className="bg-white shadow-sm" style={{ zIndex: 1040 }}>
            {/* Main Header Row */}

            <div className="py-2">
                <Container className="navbar-container">
                    <Row className="align-items-center g-2 g-md-3">
                        {/* Logo Only (Burger Removed) */}
                        <Col xs="auto" className="d-flex align-items-center">
                            <Link to="/" className="text-dark text-decoration-none d-flex align-items-center">
                                <h1 className="fw-bolder mb-0" style={{ letterSpacing: '-1.5px', fontSize: '1.2rem', color: '#ff6000' }}>
                                    trymyday
                                </h1>
                            </Link>
                        </Col>

                        {/* Search Bar Column - Desktop Only */}
                        <Col lg={6} md={5} className="d-none d-md-block px-lg-3 position-relative" style={{ marginLeft: '100px' }}>
                            <Form onSubmit={handleSearch}>
                                <div className="d-flex bg-light rounded-2 border p-1 search-wrapper transition-all position-relative">
                                    <Form.Control
                                        type="text"
                                        placeholder={t('nav.search_placeholder')}
                                        className="bg-transparent border-0 shadow-none px-3 py-1"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        style={{ fontSize: '0.82rem' }}
                                    />
                                    {searchTerm && (
                                        <Button
                                            variant="link"
                                            className="p-0 border-0 text-muted me-2"
                                            onClick={() => { setSearchTerm(''); setShowSuggestions(false); }}
                                        >
                                            <i className="bi bi-x-circle-fill"></i>
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        className="border-0 px-4 rounded-2 transition-all d-flex align-items-center"
                                        style={{ backgroundColor: '#ff6000', color: '#fff' }}
                                    >
                                        <i className="bi bi-search fs-6"></i>
                                    </Button>
                                </div>
                            </Form>

                            {/* Search Suggestions Dropdown */}
                            {showSuggestions && searchTerm.length > 1 && searchSuggestions.length > 0 && (
                                <div className="position-absolute w-100 mt-1 bg-white border rounded-3 shadow-lg overflow-hidden" style={{ zIndex: 1050, left: 0, right: 0, margin: '0 15px' }}>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item className="bg-light py-2 px-3 small fw-bold text-muted border-bottom">
                                            {t('nav.suggestions')}
                                        </ListGroup.Item>
                                        {searchSuggestions.slice(0, 5).map(prod => (
                                            <ListGroup.Item
                                                key={prod.id}
                                                action
                                                onClick={() => {
                                                    navigate(`/product/${prod.id}`);
                                                    setSearchTerm('');
                                                    setShowSuggestions(false);
                                                }}
                                                className="d-flex align-items-center gap-3 py-2 px-3 border-0"
                                            >
                                                <div className="rounded overflow-hidden border bg-white" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                                                    <img src={prod.images?.[0] || prod.image || '/assets/placeholder.png'} alt={prod.name} className="w-100 h-100 object-fit-cover" />
                                                </div>
                                                <div className="flex-grow-1 overflow-hidden">
                                                    <div className="text-truncate fw-medium small mb-0">{prod.name}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>{prod.category}</div>
                                                </div>
                                                <div className="text-end" style={{ flexShrink: 0 }}>
                                                    <div className="fw-bold text-dark" style={{ fontSize: '0.8rem' }}>{prod.price?.toLocaleString()} FCFA</div>
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                        <ListGroup.Item
                                            action
                                            onClick={handleSearch}
                                            className="text-center py-2 text-primary fw-bold small border-top bg-light"
                                        >
                                            Voir tous les résultats pour "{searchTerm}"
                                        </ListGroup.Item>
                                    </ListGroup>
                                </div>
                            )}
                        </Col>

                        {/* Action Column */}
                        <Col className="d-flex justify-content-end align-items-center gap-2 gap-md-3 gap-xl-2 flex-grow-1">

                            {/* Profile Dropdown */}
                            {user ? (
                                <NavDropdown
                                    align="end"
                                    title={
                                        <div className="d-flex align-items-center action-item px-1 px-md-2 py-1 rounded-2 transition-all">
                                            <i className="bi bi-person fs-4 me-xl-1" style={{ color: '#ff6000' }}></i>
                                            <div className="d-none d-xl-flex flex-column text-start" style={{ lineHeight: '1' }}>
                                                <span className="text-muted" style={{ fontSize: '0.5rem' }}>{t('nav.hello')},</span>
                                                <span className="fw-bold text-dark" style={{ fontSize: '0.75rem' }}>{user.name?.split(' ')[0] || user.email.split('@')[0]}</span>
                                            </div>
                                        </div>
                                    }
                                    id="user-dropdown"
                                    className="custom-nav-dropdown border-0 d-none d-md-block"
                                >
                                    <NavDropdown.Item as={Link} to="/profile"><i className="bi bi-person-circle me-3 text-warning"></i> Mon Profil</NavDropdown.Item>

                                    {(user.role === 'admin' || user.role === 'manager' || user.role === 'expediteur') && (
                                        <NavDropdown.Item as={Link} to="/admin" className="fw-bold text-primary"><i className="bi bi-speedometer2 me-3"></i> Dashboard</NavDropdown.Item>
                                    )}
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item onClick={logout} className="text-danger"><i className="bi bi-box-arrow-right me-3"></i> Déconnexion</NavDropdown.Item>
                                </NavDropdown>
                            ) : (
                                <Link to="/login" className="text-dark text-decoration-none d-none d-md-flex align-items-center action-item px-1 px-md-2 py-1 transition-all">
                                    <i className="bi bi-person fs-4 me-xl-1"></i>
                                    <span className="d-none d-xl-inline fw-bold" style={{ fontSize: '0.75rem' }}>{t('nav.login')}</span>
                                </Link>
                            )}

                            {/* Mobile Dashboard Shortcut */}
                            {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'expediteur') && (
                                <Link to="/admin" className="d-md-none text-dark text-decoration-none action-item px-1 py-1 rounded-2 transition-all">
                                    <i className="bi bi-speedometer2 fs-4" style={{ color: '#ff6000' }}></i>
                                </Link>
                            )}

                            {/* Favorites Action */}
                            <Link to="/favorites" className="text-dark text-decoration-none d-flex align-items-center action-item px-1 px-md-2 py-1 transition-all">
                                <i className="bi bi-heart fs-4 me-xl-1 text-danger"></i>
                                <span className="d-none d-xl-inline fw-bold" style={{ fontSize: '0.75rem' }}>{t('nav.favorites')}</span>
                            </Link>

                            {/* Cart Action (Desktop Only) */}
                            <Link to="/cart" className="text-dark text-decoration-none d-none d-md-flex align-items-center action-item px-1 px-md-2 py-1 transition-all">
                                <div className="position-relative me-xl-1 d-flex align-items-center">
                                    <i className="bi bi-cart3 fs-4" style={{ color: '#ff6000' }}></i>
                                    <Badge
                                        bg="danger"
                                        pill
                                        className="position-absolute top-0 start-100 translate-middle border border-2 border-white"
                                        style={{ fontSize: '0.45rem', padding: '0.3em 0.4em', backgroundColor: '#ff6000 !important' }}
                                    >
                                        {getCartCount()}
                                    </Badge>
                                </div>
                                <span className="d-none d-xl-inline fw-bold" style={{ fontSize: '0.75rem' }}>{t('nav.cart')}</span>
                            </Link>

                            {/* Mobile Notification Bell is now moved after the cart */}

                            {/* Mobile Notification Bell */}
                            <Link to="/notifications" className="d-md-none text-dark text-decoration-none position-relative d-flex align-items-center action-item px-1 py-1 rounded-2 transition-all">
                                <i className="bi bi-bell fs-4" style={{ color: '#ff6000' }}></i>
                                {notifications.length > 0 && (
                                    <Badge
                                        bg="danger"
                                        pill
                                        className="position-absolute top-0 start-100 translate-middle border border-1 border-white"
                                        style={{ fontSize: '0.45rem', padding: '0.3em 0.4em' }}
                                    >
                                        {notifications.length}
                                    </Badge>
                                )}
                            </Link>

                            {/* Notification Bell */}
                            <NavDropdown
                                align="end"
                                title={
                                    <div className="d-flex align-items-center action-item px-1 px-md-2 py-1 rounded-2 transition-all position-relative">
                                        <i className="bi bi-bell fs-4" style={{ color: '#ff6000' }}></i>
                                        {notifications.length > 0 && (
                                            <Badge
                                                bg="danger"
                                                pill
                                                className="position-absolute top-10 start-90 translate-middle-y border border-2 border-white"
                                                style={{ fontSize: '0.45rem', padding: '0.3em 0.4em' }}
                                            >
                                                {notifications.length}
                                            </Badge>
                                        )}
                                    </div>
                                }
                                id="notification-dropdown"
                                className="custom-nav-dropdown border-0 d-none d-md-block"
                                onToggle={(isOpen) => {
                                    if (isOpen) fetchHeaderNotifications();
                                }}
                            >
                                <div className="px-3 py-2 border-bottom fw-bold small text-muted text-uppercase" style={{ letterSpacing: '0.5px' }}>
                                    {t('nav.notifications')}
                                </div>
                                <div style={{ maxHeight: '350px', overflowY: 'auto', width: '300px' }}>
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-muted small">Aucune nouvelle notification</div>
                                    ) : (
                                        notifications.map(notif => (
                                            <NavDropdown.Item
                                                key={notif.id}
                                                className="d-flex align-items-start gap-3 py-3 border-bottom px-3"
                                                style={{ whiteSpace: 'normal' }}
                                                onClick={() => handleReadNotification(notif.id)}
                                            >
                                                <div className="rounded-circle d-flex align-items-center justify-content-center bg-light" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                                                    <i className={`bi ${notif.type === 'order' ? 'bi-truck' : 'bi-tag'} fs-5`} style={{ color: '#ff6000' }}></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="fw-bold small mb-1">{notif.title}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{notif.message}</div>
                                                    <div className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>
                                                        {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </NavDropdown.Item>
                                        ))
                                    )}
                                </div>
                                <NavDropdown.Item as={Link} to="/notifications" className="text-center small py-2 fw-bold border-top" style={{ color: '#ff6000' }}>
                                    {t('common.view_all')}
                                </NavDropdown.Item>
                            </NavDropdown>

                            {/* Language Selector - Desktop Only */}
                            <NavDropdown
                                align="end"
                                title={
                                    <div className="d-flex align-items-center action-item px-1 px-md-2 py-1 rounded-2 transition-all">
                                        <i className="bi bi-translate fs-4" style={{ color: '#ff6000' }}></i>
                                        <span className="fw-bold text-dark d-none d-xl-inline" style={{ fontSize: '0.75rem' }}>{language}</span>
                                    </div>
                                }
                                id="language-dropdown"
                                className="custom-nav-dropdown border-0 d-flex"
                            >
                                <NavDropdown.Item className="small" onClick={() => setLanguage('FR')}><span className="me-2">🇫🇷</span> FR</NavDropdown.Item>
                                <NavDropdown.Item className="small" onClick={() => setLanguage('EN')}><span className="me-2">🇺🇸</span> EN</NavDropdown.Item>
                                <NavDropdown.Item className="small" onClick={() => setLanguage('AR')}><span className="me-2">🇸🇦</span> AR</NavDropdown.Item>
                            </NavDropdown>

                            {/* Help Assistant */}
                            <Link to="/help" className="text-dark text-decoration-none d-flex align-items-center action-item px-1 px-md-2 py-1 transition-all rounded-2">
                                <i className="bi bi-question-circle fs-4" style={{ color: '#ff6000' }}></i>
                            </Link>

                        </Col>
                    </Row>

                    {/* Mobile Search Bar */}
                    <div className="d-md-none mt-2 position-relative">
                        <Form onSubmit={handleSearch}>
                            <div className="d-flex bg-light rounded-2 border p-1 border-secondary-subtle">
                                <Form.Control
                                    type="text"
                                    placeholder={t('nav.search_placeholder')}
                                    className="bg-transparent border-0 shadow-none px-3"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    style={{ fontSize: '0.85rem' }}
                                />
                                {searchTerm && (
                                    <Button
                                        variant="link"
                                        className="p-0 border-0 text-muted me-2"
                                        onClick={() => { setSearchTerm(''); setShowSuggestions(false); }}
                                    >
                                        <i className="bi bi-x-circle-fill"></i>
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    variant="link"
                                    className="text-dark p-0 px-2"
                                >
                                    <i className="bi bi-search"></i>
                                </Button>
                            </div>
                        </Form>
                        {/* Mobile Search Suggestions */}
                        {showSuggestions && searchTerm.length > 1 && searchSuggestions.length > 0 && (
                            <div className="position-absolute w-100 mt-1 bg-white border rounded-3 shadow-lg overflow-hidden" style={{ zIndex: 1050, left: 0, right: 0 }}>
                                <ListGroup variant="flush">
                                    <ListGroup.Item className="bg-light py-2 px-3 small fw-bold text-muted border-bottom">
                                        {t('nav.suggestions')}
                                    </ListGroup.Item>
                                    {searchSuggestions.slice(0, 5).map(prod => (
                                        <ListGroup.Item
                                            key={prod.id}
                                            action
                                            onClick={() => {
                                                navigate(`/product/${prod.id}`);
                                                setSearchTerm('');
                                                setShowSuggestions(false);
                                            }}
                                            className="d-flex align-items-center gap-3 py-2 px-3 border-0"
                                        >
                                            <div className="rounded overflow-hidden border bg-white" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                                                <img src={prod.images?.[0] || prod.image || '/assets/placeholder.png'} alt={prod.name} className="w-100 h-100 object-fit-cover" />
                                            </div>
                                            <div className="flex-grow-1 overflow-hidden">
                                                <div className="text-truncate fw-medium small mb-0">{prod.name}</div>
                                                <div className="text-muted" style={{ fontSize: '0.65rem' }}>{prod.category}</div>
                                            </div>
                                            <div className="text-end" style={{ flexShrink: 0 }}>
                                                <div className="fw-bold text-dark" style={{ fontSize: '0.8rem' }}>{prod.price?.toLocaleString()} FCFA</div>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                    <ListGroup.Item
                                        action
                                        onClick={handleSearch}
                                        className="text-center py-2 text-primary fw-bold small border-top bg-light"
                                    >
                                        Voir tous les résultats pour "{searchTerm}"
                                    </ListGroup.Item>
                                </ListGroup>
                            </div>
                        )}
                    </div>
                </Container>
            </div>


            {/* Category Navigation Bar */}
            <div className="border-bottom bg-white d-none d-lg-block position-relative" style={{ margin: 0, padding: 0 }} ref={menuRef}>
                <Container className="navbar-container">
                    <Nav className="align-items-center">
                        {/* Categories Trigger */}
                        <div
                            className={`categories-trigger py-2 pe-3 me-4 ${showSidebarMenu ? 'active' : ''}`}
                            onClick={() => setShowSidebarMenu(!showSidebarMenu)}
                            style={{ cursor: 'pointer' }}
                        >
                            <i className="bi bi-list fs-6 me-2"></i>
                            <span className="fw-bold small">{t('nav.all_categories').toUpperCase()}</span>
                        </div>

                        {/* Standard Nav Links */}
                        <Link to="/shop?sort=new" className="nav-link-item py-2 px-3 text-uppercase small fw-bold text-dark text-decoration-none">
                            {t('nav.new_arrivals')}
                        </Link>
                        <Link to="/shop" className="nav-link-item py-2 px-3 text-uppercase small fw-bold text-dark text-decoration-none">
                            {t('nav.brands')}
                        </Link>
                        <Link to="/shop?cat=Gifts" className="nav-link-item py-2 px-3 text-uppercase small fw-bold text-dark text-decoration-none">
                            {t('nav.gift_ideas')}
                        </Link>
                        <Link to="/shop?cat=Collections" className="nav-link-item py-2 px-3 text-uppercase small fw-bold text-dark text-decoration-none">
                            {t('nav.collections')}
                        </Link>
                        <Link to="/shop?cat=Favorites" className="nav-link-item py-2 px-3 text-uppercase small fw-bold text-dark text-decoration-none">
                            {t('nav.favorites')}
                        </Link>
                        <Link to="/shop?cat=Flash" className="nav-link-item py-2 px-3 text-uppercase small fw-bold text-decoration-none" style={{ color: '#ff6000' }}>
                            <i className="bi bi-lightning-fill me-1"></i> {t('nav.flash').toUpperCase()}
                        </Link>
                        {/* Quick links for common categories */}
                        <Link to="/shop?cat=Best" className="nav-link-item py-2 px-3 text-uppercase small fw-bold text-danger text-decoration-none">
                            <i className="bi bi-fire me-1"></i> {t('nav.best_sellers').toUpperCase()}
                        </Link>
                    </Nav>

                </Container>
                {/* Sidebar Mega Menu Overlay */}
                <div className={`sidebar-mega-menu ${showSidebarMenu ? 'show' : ''}`}>
                    <Container className="navbar-container h-100 p-0 shadow-lg border rounded-bottom bg-white overflow-hidden">
                        <div className="d-flex h-100">
                            {/* Left Side: Sidebar */}
                            <div className="category-sidebar border-end bg-light" style={{ width: '220px' }}>
                                {Object.entries(CATEGORIES).map(([category, data]) => (
                                    <div
                                        key={category}
                                        className={`sidebar-item d-flex align-items-center justify-content-between px-2 py-2 cursor-pointer ${activeSidebarCat === category ? 'active' : ''}`}
                                        onMouseEnter={() => setActiveSidebarCat(category)}
                                        onClick={() => {
                                            navigate(`/shop?cat=${category}`);
                                            setShowSidebarMenu(false);
                                        }}
                                    >
                                        <div className="d-flex align-items-center">
                                            <i className={`bi ${data.icon} me-3`} style={{ fontSize: '0.9rem' }}></i>
                                            <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>{category}</span>
                                        </div>
                                        <i className="bi bi-chevron-right opacity-50" style={{ fontSize: '0.7rem' }}></i>
                                    </div>
                                ))}
                            </div>

                            {/* Right Side: Content Area */}
                            <div className="category-content p-2 flex-grow-1 overflow-auto">
                                <h4 className="fw-bold mb-4 d-flex align-items-center">
                                    {activeSidebarCat}
                                </h4>
                                <Row className="g-2">
                                    {Object.entries(CATEGORIES[activeSidebarCat]?.groups || {}).map(([groupName, items]) => (
                                        <Col key={groupName} md={3}>
                                            <h6 className="fw-bold border-bottom pb-1 mb-1 text-dark group-header">
                                                {groupName}
                                            </h6>
                                            <ul className="list-unstyled">
                                                {items.map(sub => (
                                                    <li key={sub} className="mb-2">
                                                        <Link
                                                            to={`/shop?cat=${activeSidebarCat}&sub=${sub}`}
                                                            className="subcategory-link text-muted text-decoration-none d-block"
                                                            style={{ fontSize: '0.85rem' }}
                                                            onClick={() => setShowSidebarMenu(false)}
                                                        >
                                                            {sub}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        </div>
                    </Container>
                </div>
            </div >

            <style>{`
                .hover-orange:hover {
                    color: #ff6000 !important;
                }
                
                .search-wrapper:focus-within {
                    border-color: #ff6000 !important;
                    background-color: #fff !important;
                    box-shadow: 0 0 0 4px rgba(255, 96, 0, 0.1);
                }

                .action-item {
                    color: #333;
                    border: 1px solid transparent;
                }
                .action-item:hover {
                    color: #ff6000 !important;
                    background-color: #fffaf5;
                    border-color: #ffe0cc;
                }

                .categories-trigger {
                    cursor: pointer;
                    transition: all 0.3s;
                    border-radius: 4px;
                }
                .categories-trigger:hover, .categories-trigger.active {
                    color: #ff6000;
                    background-color: #fffaf5;
                }
                
                .nav-link-item {
                    transition: all 0.2s;
                    position: relative;
                }
                .nav-link-item:after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    width: 0;
                    height: 2px;
                    background: #ff6000;
                    transition: all 0.3s;
                    transform: translateX(-50%);
                }
                .nav-link-item:hover {
                    color: #ff6000 !important;
                }
                .nav-link-item:hover:after {
                    width: 70%;
                }
                
                /* Sidebar Mega Menu Styles */
                .sidebar-mega-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    height: 500px;
                    z-index: 1050;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(10px);
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                }
                .sidebar-mega-menu.show {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }
                
                .sidebar-item {
                    transition: all 0.2s;
                    border-left: 4px solid transparent;
                }
                .sidebar-item.active {
                    background-color: #fff !important;
                    color: #ff6000;
                    border-left-color: #ff6000;
                    font-weight: bold;
                }
                
                .subcategory-link:hover {
                    color: #ff6000 !important;
                    padding-left: 5px;
                }
                
                .custom-nav-dropdown .dropdown-toggle::after {
                    display: none;
                }
                .custom-nav-dropdown .dropdown-menu {
                    margin-top: 10px;
                    border: none;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    border-radius: 12px;
                    padding: 10px;
                    min-width: 240px;
                }
                .custom-nav-dropdown .dropdown-item {
                    border-radius: 8px;
                    padding: 10px 15px;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .custom-nav-dropdown .dropdown-item:hover {
                    background-color: #fffaf5;
                    color: #ff6000;
                }
            `}</style>
        </header >
    );
};

export default Navigation;


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
