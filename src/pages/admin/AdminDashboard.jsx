import { Row, Col, Card, Badge } from 'react-bootstrap';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useLanguage } from '../../context/LanguageContext';

const AdminDashboard = () => {
    const { products, orders, users, expenses } = useData();
    const { user: authUser } = useAuth();
    const { balance } = useWallet();
    const { t } = useLanguage();

    const isManager = authUser?.role === 'manager';
    const isExpediteur = authUser?.role === 'expediteur';

    // Filter orders (last 30 days for manager/expediteur)
    const displayOrders = (isManager || isExpediteur) ? (orders || []).filter(order => {
        try {
            if (!order || !order.date) return true;
            const orderDate = new Date(order.date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            if (!isNaN(orderDate.getTime())) {
                return orderDate >= thirtyDaysAgo;
            }
            if (typeof order.date === 'string' && order.date.includes('/')) {
                const [d, m, y] = order.date.split('/');
                const parsedDate = new Date(`${y}-${m}-${d}`);
                return parsedDate >= thirtyDaysAgo;
            }
            return true;
        } catch (e) {
            return true;
        }
    }) : (orders || []);

    const totalRevenue = displayOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const totalExpenses = (expenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    const stats = [
        !isExpediteur && { label: t('admin_dashboard.total_products'), value: products.length, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        { label: t('admin_dashboard.orders'), value: displayOrders.filter(o => o.status !== 'Annulée').length, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
        isManager && { label: t('admin_dashboard.my_balance'), value: (balance || 0).toLocaleString() + ' FCFA', gradient: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)' },
        (!isManager && !isExpediteur) && { label: t('admin_dashboard.clients'), value: (users || []).length, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
        (!isManager && !isExpediteur) && { label: t('admin_dashboard.revenue'), value: totalRevenue.toLocaleString() + ' FCFA', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
        (!isManager && !isExpediteur) && { label: t('admin_dashboard.gross_margin'), value: totalRevenue.toLocaleString() + ' FCFA', gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
        (!isManager && !isExpediteur) && { label: t('admin_dashboard.fixed_costs'), value: totalExpenses.toLocaleString() + ' FCFA', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
        (!isManager && !isExpediteur) && { label: t('admin_dashboard.net_profit'), value: netProfit.toLocaleString() + ' FCFA', gradient: netProfit >= 0 ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' : 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)' },
    ].filter(Boolean);

    return (
        <div className="admin-dashboard-tech">
            <h2 className="mb-3 mb-md-4 fw-bold dashboard-main-title">{t('admin_dashboard.overview')}</h2>

            <Row className="g-2 g-md-3">
                {stats.map((stat, idx) => (
                    <Col key={idx} xs={6} md={3}>
                        <Card className="border-0 shadow-sm text-white h-100 card-stat-hover" style={{ background: stat.gradient, borderRadius: '16px' }}>
                            <Card.Body className="p-3 d-flex flex-column justify-content-center">
                                <div className="opacity-90 label-text mb-1">{stat.label}</div>
                                <div className="fw-bold value-text">{stat.value}</div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Cancellation Alerts */}
            {displayOrders.filter(o => o.status === "Demande d'annulation").length > 0 && (
                <Card className="border-0 shadow-sm mt-4 bg-danger text-white overflow-hidden" style={{ borderRadius: '12px' }}>
                    <Card.Body className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 p-3">
                        <div className="d-flex align-items-start gap-3">
                            <div className="bg-white bg-opacity-20 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                                <i className="bi bi-exclamation-octagon-fill fs-5"></i>
                            </div>
                            <div>
                                <h6 className="mb-1 fw-bold">{t('admin_dashboard.cancellation_requests')}</h6>
                                <p className="mb-0 small opacity-90">
                                    {t('admin_dashboard.pending_confirmations').replace('{count}', displayOrders.filter(o => o.status === "Demande d'annulation").length)}
                                </p>
                            </div>
                        </div>
                        <a href="/admin/orders" className="btn btn-light btn-sm fw-bold px-3 py-2 rounded-pill shadow-sm mt-1 mt-md-0">
                            {t('admin_dashboard.manage_requests')}
                        </a>
                    </Card.Body>
                </Card>
            )}

            {/* Active Orders Section */}
            <div className="mt-5">
                <div className="d-flex align-items-center justify-content-between mb-3 mb-md-4">
                    <h5 className="fw-bold mb-0 section-title-tech d-flex align-items-center gap-2">
                        <i className="bi bi-clock-history text-warning"></i>
                        {t('admin_dashboard.active_orders')}
                    </h5>
                    <Badge pill bg="warning" className="text-dark px-3 py-1.5 fw-bold" style={{ fontSize: '0.75rem' }}>
                        {displayOrders.filter(o => o.status !== 'Livrée' && o.status !== 'Livré' && o.status !== 'Annulée').length}
                    </Badge>
                </div>
                <>
                    {/* 📱 Mobile View (Cards) */}
                    <div className="d-md-none d-flex flex-column gap-3">
                        {displayOrders.filter(o => o.status !== 'Livrée' && o.status !== 'Livré' && o.status !== 'Annulée').slice(0, 5).length === 0 ? (
                            <div className="text-center text-muted py-5 bg-white border rounded-4 shadow-sm">
                                <i className="bi bi-inbox d-block fs-2 mb-2 opacity-30"></i>
                                {t('admin_dashboard.no_active_orders')}
                            </div>
                        ) : (
                            displayOrders.filter(o => o.status !== 'Livrée' && o.status !== 'Livré' && o.status !== 'Annulée').slice(0, 5).map(order => (
                                <Card key={order.id} className="border-0 shadow-sm rounded-4 overflow-hidden">
                                    <Card.Body className="p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                                            <div className="fw-mono text-primary fw-bold" style={{ fontSize: '0.85rem' }}>
                                                #{order.id.toString().includes('order_') ? order.id.toString().split('_')[1].substring(0, 8) : order.id}
                                            </div>
                                            <div className="text-muted small">{order.date}</div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <div>
                                                <div className="fw-bold text-dark mb-1">{order.customerName || order.customer || 'Client'}</div>
                                                <div className="text-muted small"><i className="bi bi-telephone me-1"></i>{order.phone || '-'}</div>
                                            </div>
                                            <div className="text-end">
                                                <div className="fw-bold text-dark fs-6">{order.total.toLocaleString()} FCFA</div>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                            <span className="small text-muted">{t('admin_dashboard.status')}</span>
                                            <Badge bg={order.status === 'En expédition' ? 'info' :
                                                order.status === 'En cours' ? 'warning' :
                                                    order.status === 'En attente' ? 'secondary' :
                                                        order.status === "Demande d'annulation" ? 'danger' :
                                                            order.status === 'Annulée' ? 'danger' : 'primary'
                                            } className={`px-2 py-1 fw-bold`} style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* 💻 Desktop View (Table) */}
                    <div className="d-none d-md-block table-responsive-container shadow-sm rounded-3 overflow-hidden bg-white border">
                        <table className="table table-hover mb-0 align-middle">
                            <thead className="bg-light text-muted small text-uppercase">
                                <tr>
                                    <th className="ps-3 border-0 py-3">{t('admin_dashboard.order_id', 'ID Commande')}</th>
                                    <th className="border-0 py-3">{t('admin_dashboard.client', 'Client')}</th>
                                    <th className="d-none d-lg-table-cell border-0 py-3">{t('admin_dashboard.client_id', 'ID Client')}</th>
                                    <th className="border-0 py-3">{t('admin_dashboard.phone', 'Téléphone')}</th>
                                    <th className="border-0 py-3">{t('admin_dashboard.date', 'Date')}</th>
                                    <th className="border-0 py-3">{t('admin_dashboard.amount', 'Montant')}</th>
                                    <th className="pe-3 border-0 py-3 text-end">{t('admin_dashboard.status', 'Statut')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayOrders.filter(o => o.status !== 'Livrée' && o.status !== 'Livré' && o.status !== 'Annulée').slice(0, 5).length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center text-muted py-5 border-0">
                                            <i className="bi bi-inbox d-block fs-2 mb-2 opacity-30"></i>
                                            {t('admin_dashboard.no_active_orders')}
                                        </td>
                                    </tr>
                                ) : (
                                    displayOrders.filter(o => o.status !== 'Livrée' && o.status !== 'Livré' && o.status !== 'Annulée').slice(0, 5).map(order => (
                                        <tr key={order.id} className="transition-all order-row-tech">
                                            <td className="ps-3 py-3 border-bottom-0">
                                                <div className="fw-mono text-primary fw-bold" style={{ fontSize: '0.85rem' }}>
                                                    #{order.id.toString().includes('order_') ? order.id.toString().split('_')[1].substring(0, 8) : order.id}
                                                </div>
                                            </td>
                                            <td className="py-3 border-bottom-0">
                                                <div className="fw-medium text-dark">{order.customerName || order.customer || 'Client'}</div>
                                            </td>
                                            <td className="d-none d-lg-table-cell py-3 small text-muted border-bottom-0">{order.customerId || order.userId || '-'}</td>
                                            <td className="py-3 small text-muted border-bottom-0">{order.phone || '-'}</td>
                                            <td className="py-3 small text-muted border-bottom-0">{order.date}</td>
                                            <td className="py-3 border-bottom-0">
                                                <div className="fw-bold text-dark">{order.total.toLocaleString()} FCFA</div>
                                            </td>
                                            <td className="pe-3 py-3 text-end border-bottom-0">
                                                <Badge bg={order.status === 'En expédition' ? 'info' :
                                                    order.status === 'En cours' ? 'warning' :
                                                        order.status === 'En attente' ? 'secondary' :
                                                            order.status === "Demande d'annulation" ? 'danger animate-pulse' :
                                                                order.status === 'Annulée' ? 'danger' : 'primary'
                                                } className={`px-2 py-1.5 fw-bold`} style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                                    {order.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            </div>

            {/* Delivered Orders Section */}
            <div className="mt-5 mb-5">
                <div className="d-flex align-items-center justify-content-between mb-3 mb-md-4">
                    <h5 className="fw-bold mb-0 section-title-tech d-flex align-items-center gap-2">
                        <i className="bi bi-check-circle text-success"></i>
                        {t('admin_dashboard.delivered_orders')}
                    </h5>
                    <Badge pill bg="success" className="px-3 py-1.5 fw-bold" style={{ fontSize: '0.75rem' }}>
                        {displayOrders.filter(o => o.status === 'Livrée' || o.status === 'Livré').length}
                    </Badge>
                </div>
                <>
                    {/* 📱 Mobile View (Cards) */}
                    <div className="d-md-none d-flex flex-column gap-3">
                        {displayOrders.filter(o => o.status === 'Livrée' || o.status === 'Livré').slice(0, 5).length === 0 ? (
                            <div className="text-center text-muted py-5 bg-white border rounded-4 shadow-sm">
                                <i className="bi bi-clipboard-check d-block fs-2 mb-2 opacity-30"></i>
                                {t('admin_dashboard.no_delivered_orders')}
                            </div>
                        ) : (
                            displayOrders.filter(o => o.status === 'Livrée' || o.status === 'Livré').slice(0, 5).map(order => (
                                <Card key={order.id} className="border-0 shadow-sm rounded-4 overflow-hidden">
                                    <Card.Body className="p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                                            <div className="fw-mono text-primary fw-bold" style={{ fontSize: '0.85rem' }}>
                                                #{order.id.toString().includes('order_') ? order.id.toString().split('_')[1].substring(0, 8) : order.id}
                                            </div>
                                            <div className="text-muted small">{order.date}</div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <div>
                                                <div className="fw-bold text-dark mb-1">{order.customerName || order.customer || 'Client'}</div>
                                                <div className="text-muted small"><i className="bi bi-telephone me-1"></i>{order.phone || '-'}</div>
                                            </div>
                                            <div className="text-end">
                                                <div className="fw-bold text-success fs-6">{order.total.toLocaleString()} FCFA</div>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                            <span className="small text-muted">{t('admin_dashboard.status')}</span>
                                            <Badge bg="success" className={`px-2 py-1 fw-bold`} style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                                Livrée
                                            </Badge>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* 💻 Desktop View (Table) */}
                    <div className="d-none d-md-block table-responsive-container shadow-sm rounded-3 overflow-hidden bg-white border">
                        <table className="table table-hover mb-0 align-middle">
                            <thead className="bg-light text-muted small text-uppercase">
                                <tr>
                                    <th className="ps-3 border-0 py-3">{t('admin_dashboard.order_id', 'ID Commande')}</th>
                                    <th className="border-0 py-3">{t('admin_dashboard.client', 'Client')}</th>
                                    <th className="d-none d-lg-table-cell border-0 py-3">{t('admin_dashboard.client_id', 'ID Client')}</th>
                                    <th className="border-0 py-3">{t('admin_dashboard.phone', 'Téléphone')}</th>
                                    <th className="border-0 py-3">{t('admin_dashboard.date', 'Date')}</th>
                                    <th className="border-0 py-3">{t('admin_dashboard.amount', 'Montant')}</th>
                                    <th className="pe-3 border-0 py-3 text-end">{t('admin_dashboard.status', 'Statut')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayOrders.filter(o => o.status === 'Livrée' || o.status === 'Livré').slice(0, 5).length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center text-muted py-5 border-0">
                                            <i className="bi bi-clipboard-check d-block fs-2 mb-2 opacity-30"></i>
                                            {t('admin_dashboard.no_delivered_orders')}
                                        </td>
                                    </tr>
                                ) : (
                                    displayOrders.filter(o => o.status === 'Livrée' || o.status === 'Livré').slice(0, 5).map(order => (
                                        <tr key={order.id} className="transition-all order-row-tech">
                                            <td className="ps-3 py-3 border-bottom-0">
                                                <div className="fw-mono text-primary fw-bold" style={{ fontSize: '0.85rem' }}>
                                                    #{order.id.toString().includes('order_') ? order.id.toString().split('_')[1].substring(0, 8) : order.id}
                                                </div>
                                            </td>
                                            <td className="py-3 border-bottom-0">
                                                <div className="fw-medium text-dark">{order.customerName || order.customer || 'Client'}</div>
                                            </td>
                                            <td className="d-none d-lg-table-cell py-3 small text-muted border-bottom-0">{order.customerId || order.userId || '-'}</td>
                                            <td className="py-3 small text-muted border-bottom-0">{order.phone || '-'}</td>
                                            <td className="py-3 small text-muted border-bottom-0">{order.date}</td>
                                            <td className="py-3 border-bottom-0">
                                                <div className="fw-bold text-success">{order.total.toLocaleString()} FCFA</div>
                                            </td>
                                            <td className="pe-3 py-3 text-end border-bottom-0">
                                                <Badge bg="success" className="px-2 py-1.5 fw-bold" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                                    Livrée
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            </div>

            <style>{`
                .dashboard-main-title { font-size: 1.5rem; letter-spacing: -0.5px; }
                .label-text { font-size: 0.75rem; font-weight: 500; }
                .value-text { font-size: 1.1rem; }
                .section-title-tech { font-size: 1.1rem; letter-spacing: -0.3px; }
                .order-id-tech { font-size: 0.8rem; font-family: 'Monaco', monospace; }
                .badge-tech { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2px; border-radius: 6px; }
                
                @media (max-width: 767.98px) {
                    .dashboard-main-title { font-size: 1.25rem; }
                    .value-text { font-size: 0.95rem; }
                    .table-responsive-container { border: none !important; box-shadow: none !important; background: transparent !important; }
                    .order-row-tech { 
                        display: flex !important; 
                        flex-wrap: wrap; 
                        background: #fff; 
                        margin-bottom: 12px; 
                        border-radius: 12px; 
                        padding: 12px; 
                        border: 1px solid #eee; 
                        box-shadow: 0 2px 8px rgba(0,0,0,0.03); 
                    }
                    .order-id-cell { width: auto; flex-grow: 1; padding: 0 !important; }
                    .order-customer-cell { width: 100%; margin-top: 4px; padding: 0 !important; }
                    .order-amount-cell { width: auto; flex-grow: 1; margin-top: 10px; padding: 0 !important; }
                    .order-status-cell { width: auto; margin-top: 10px; padding: 0 !important; text-align: left !important; }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
