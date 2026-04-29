import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Container, Row, Col, ListGroup, Card, Button, Offcanvas } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const AdminLayout = () => {
    const location = useLocation();
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const { t } = useLanguage();

    let menuItems = [
        { path: '/admin', label: t('admin_dashboard.overview'), icon: 'bi-speedometer2' },
        { path: '/admin/products', label: t('admin_dashboard.total_products').replace('Total ', ''), icon: 'bi-box-seam' },
        { path: '/admin/orders', label: t('admin_dashboard.orders'), icon: 'bi-cart-check' },
        { path: '/admin/users', label: t('admin_dashboard.clients'), icon: 'bi-people' },
        { path: '/admin/finance', label: t('admin_layout.finance', 'Finance'), icon: 'bi-bar-chart-line' },
        { path: '/admin/wallet', label: t('admin_layout.wallet', 'Wallet'), icon: 'bi-wallet2' },
        { path: '/admin/support', label: t('admin_layout.support', 'Support'), icon: 'bi-question-square' },
    ];

    const { user } = useAuth();

    if (user?.role === 'manager') {
        menuItems = menuItems.filter(item => item.path !== '/admin/users' && item.path !== '/admin/finance');
    } else if (user?.role === 'expediteur') {
        menuItems = menuItems.filter(item =>
            item.path === '/admin' || item.path === '/admin/orders'
        );
    }

    const SidebarContent = () => (
        <Card className="shadow-sm border-0 mb-4 h-100">
            <Card.Body className="p-0">
                <div className="p-3 text-white" style={{ background: 'linear-gradient(135deg, #ef9c52ff 0%, #f1823dff 100%)', borderRadius: '12px 12px 0 0' }}>
                    <h6 className="mb-0 fw-bold">
                        <i className={`bi ${user?.role === 'expediteur' ? 'bi-truck' : 'bi-shield-lock'} me-2`}></i>
                        {user?.role === 'manager' ? t('admin_layout.manager_panel', 'Manager Panel') :
                            user?.role === 'expediteur' ? t('admin_layout.shipper_panel', 'Panel Expéditeur') : t('admin_layout.admin_panel', 'Admin Panel')}
                    </h6>
                    <small style={{ opacity: 0.8, fontSize: '0.7rem' }}>{user?.name}</small>
                </div>
                <ListGroup variant="flush" className="py-1">
                    {menuItems.map(item => (
                        <ListGroup.Item
                            key={item.path}
                            as={Link}
                            to={item.path}
                            action
                            active={location.pathname === item.path}
                            onClick={() => setShowMobileMenu(false)}
                            className="border-0 py-2.5 px-3 d-flex align-items-center transition-all rounded-0"
                            style={{ fontSize: '0.9rem' }}
                        >
                            <i className={`${item.icon} me-2 fs-6`} style={{ color: location.pathname === item.path ? '#fff' : '#ff6000' }}></i>
                            <span className="fw-medium">{item.label}</span>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Card.Body>
        </Card>
    );

    return (
        <Container fluid className="py-3 px-2 px-md-4 position-relative" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <Row className="g-3">
                {/* Integrated Mobile Menu Trigger */}
                <div className="d-md-none" style={{ position: 'absolute', left: '0', top: '20px', zIndex: 1030 }}>
                    <Button
                        variant="white"
                        className="d-flex align-items-center justify-content-center border-0 border-top border-bottom border-end bg-white shadow-sm rounded-end p-0"
                        onClick={() => setShowMobileMenu(true)}
                        style={{ width: '28px', height: '54px', opacity: 0.98 }}
                    >
                        <i className="bi bi-chevron-right fs-5 text-warning"></i>
                    </Button>
                </div>

                {/* Sidebar Desktop */}
                <Col md={3} lg={2} className="d-none d-md-block">
                    <SidebarContent />
                </Col>

                {/* Main Content Area */}
                <Col md={9} lg={10} className="admin-content-col">
                    <div className="bg-white p-3 p-md-4 rounded-3 shadow-sm" style={{ minHeight: '85vh' }}>
                        <Outlet />
                    </div>
                </Col>
            </Row>

            {/* Offcanvas for Mobile Sidebar */}
            <Offcanvas
                show={showMobileMenu}
                onHide={() => setShowMobileMenu(false)}
                placement="start"
                style={{ width: '280px', backgroundColor: '#f8f9fa' }}
                className="d-md-none"
            >
                <Offcanvas.Header closeButton className="bg-white border-bottom shadow-sm">
                    <Offcanvas.Title className="fw-bold fs-6">{t('admin_layout.admin_panel', 'Navigation Admin')}</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-3">
                    <SidebarContent />
                </Offcanvas.Body>
            </Offcanvas>

            <style>{`
                .transition-all { transition: all 0.2s ease-in-out; }
                .admin-content-col { transition: all 0.3s ease; }
                @media (max-width: 767.98px) {
                    .admin-content-col {
                        padding-left: 40px !important;
                    }
                }
            `}</style>
        </Container>
    );
};

export default AdminLayout;
