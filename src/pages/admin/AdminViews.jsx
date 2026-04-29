import { useState } from 'react';
import { Table, Badge, Button, Modal, Form, InputGroup, Row, Col, Card } from 'react-bootstrap';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import Barcode from 'react-barcode';
import BarcodeScanner from '../../components/BarcodeScanner';
import API_BASE_URL from '../../config';

export const AdminOrders = () => {
    const { t } = useLanguage();
    const { orders, updateOrder } = useData();
    const { user } = useAuth();
    const { showToast, confirm } = useToast();
    const isManager = user?.role === 'manager';
    const isExpediteur = user?.role === 'expediteur';
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusNote, setStatusNote] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [detailsOrder, setDetailsOrder] = useState(null);
    const [showScanner, setShowScanner] = useState(false);

    // Auto-open order on barcode scan / exact search
    const handleSearchChange = (val) => {
        setSearchTerm(val);
    };

    const handlePrintSlip = (order) => {
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        const barcodeSvg = document.getElementById(`barcode-svg-${order.id}`)?.outerHTML || '';

        printWindow.document.write(`
            <html>
                <head>
                    <title>Fiche Commande #${order.id}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 20px; text-align: center; }
                        .ticket { border: 1px dashed #000; padding: 15px; width: 80mm; margin: 0 auto; }
                        .header { font-weight: bold; font-size: 1.2rem; margin-bottom: 10px; }
                        .details { text-align: left; font-size: 0.9rem; margin: 15px 0; }
                        .barcode { margin: 20px 0; }
                        .footer { font-size: 0.7rem; color: #666; margin-top: 10px; }
                        @media print {
                            body { margin: 0; padding: 0; }
                            .ticket { border: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="ticket">
                        <div class="header">Trymyday</div>
                        <div class="header">Commande #${order.id}</div>
                        <div class="barcode">
                            ${barcodeSvg}
                        </div>
                        <div class="details">
                            <strong>Client:</strong> ${order.customerName || order.customer}<br>
                            <strong>Tel:</strong> ${order.phone || 'N/A'}<br>
                            <strong>Date:</strong> ${order.date}<br>
                            <strong>Total:</strong> ${order.total.toLocaleString()} FCFA<br><br>
                            <strong>Articles:</strong><br>
                            ${order.items?.map(i => `- ${i.name} (x${i.quantity})`).join('<br>')}
                        </div>
                        <div class="footer">Merci de votre confiance !</div>
                    </div>
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Filter orders (last 30 days for manager/expediteur)
    const displayOrders = (isManager || isExpediteur) ? orders.filter(order => {
        try {
            const orderDate = new Date(order.date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            if (!isNaN(orderDate.getTime())) return orderDate >= thirtyDaysAgo;
            if (order.date.includes('/')) {
                const [d, m, y] = order.date.split('/');
                const parsedDate = new Date(`${y}-${m}-${d}`);
                return parsedDate >= thirtyDaysAgo;
            }
            return true;
        } catch (e) {
            return true;
        }
    }) : orders;

    // Filter orders with UI search/status
    const filteredOrders = displayOrders.filter(order => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.customer && order.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.email && order.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Statistics based on displayOrders (last 30 days if manager)
    const stats = {
        total: displayOrders.length,
        pending: displayOrders.filter(o => o.status === 'En attente').length,
        inProgress: displayOrders.filter(o => o.status === 'En cours de préparation').length,
        shipping: displayOrders.filter(o => o.status === 'En route').length,
        delivered: displayOrders.filter(o => o.status === 'Livrée' || o.status === 'Livré').length,
        cancelled: displayOrders.filter(o => o.status === 'Annulée').length,
        totalRevenue: displayOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0)
    };

    const handleStatusChange = (order, newStatus) => {
        setSelectedOrder(order);
        setShowModal(true);
        setStatusNote('');
        setTrackingNumber(order.trackingNumber || '');
    };

    const sendEmailNotification = async (order, newStatus, note) => {
        try {
            console.log('📧 Sending email notification for order:', order.id);
            const response = await authFetch(`${API_BASE_URL}/api/admin/order-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order: order,
                    status: newStatus,
                    note: note
                }),
            });

            const data = await response.json();
            if (data.success) {
                console.log('✅ Email notification sent successfully');
            } else {
                console.error('❌ Failed to send email notification:', data.message);
            }
        } catch (error) {
            console.error('❌ Error calling email API:', error);
        }
    };

    const saveStatusChange = async () => {
        if (!selectedOrder) return;

        const newStatus = document.getElementById('newStatus').value;

        try {
            // Call the shared updateOrder function from DataContext
            // which now triggers the backend API AND the automatic email
            await updateOrder(selectedOrder.id, {
                status: newStatus,
                note: statusNote,
                admin: 'Trymyday',
                trackingNumber: trackingNumber
            });

            showToast('Statut mis à jour avec succès !', 'success');
            setShowModal(false);
        } catch (error) {
            console.error('Error updating status:', error);
            showToast('Erreur lors de la mise à jour du statut.', 'danger');
        }
    };

    const handleApproveCancellation = async (order) => {
        // Guard: prevent approving if already cancelled
        if (order.status === 'Annulée') {
            showToast('Cette commande est déjà annulée.', 'info');
            return;
        }
        if (order.status !== "Demande d'annulation") {
            showToast('Cette commande n\'a pas de demande d\'annulation active.', 'info');
            return;
        }

        const ok = await confirm({
            title: 'Approuver l\'annulation',
            message: `Approuver l'annulation de la commande #${order.id} et rembourser ${order.total.toLocaleString()} FCFA au client ?`,
            variant: 'danger',
            confirmText: 'Approuver & Rembourser'
        });
        if (!ok) return;

        const timestamp = new Date().toLocaleString('fr-FR');
        const timelineEntry = {
            date: timestamp,
            oldStatus: order.status,
            newStatus: 'Annulée',
            note: "Annulation approuvée par l'admin. Client remboursé.",
            admin: 'Trymyday'
        };

        // 1. Update order status via DataContext (syncs frontend + backend)
        await updateOrder(order.id, {
            status: 'Annulée',
            note: "Annulation approuvée. Remboursement effectué.",
            admin: 'Trymyday',
            timeline: [...(order.timeline || []), timelineEntry],
            refundProcessed: true
        });

        // 2. Process refund via backend (only once)
        try {
            const response = await authFetch(`${API_BASE_URL}/api/admin/order-refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order: order,
                    note: 'Annulation approuvée par Trymyday. Remboursement effectué.'
                }),
            });

            const data = await response.json();
            if (data.success) {
                showToast(`✅ Commande #${order.id} annulée. Remboursement effectué.`, 'success');
            } else {
                showToast(`⚠️ Remboursement a échoué : ${data.message}`, 'warning');
            }
        } catch (error) {
            showToast('⚠️ Erreur lors du remboursement. Vérifiez manuellement.', 'danger');
        }
    };

    const handleRefuseCancellation = async (order) => {
        const ok = await confirm({
            title: 'Refuser l\'annulation',
            message: `Refuser la demande d'annulation pour la commande #${order.id} ?`,
            variant: 'secondary'
        });
        if (!ok) return;

        const timestamp = new Date().toLocaleString('fr-FR');
        const timelineEntry = {
            date: timestamp,
            oldStatus: order.status,
            newStatus: 'En cours de préparation',
            note: "Demande d'annulation refusée par Trymyday.",
            admin: 'Trymyday'
        };

        // Use DataContext updateOrder for proper sync
        await updateOrder(order.id, {
            status: 'En cours de préparation',
            note: "Demande d'annulation refusée.",
            admin: 'Trymyday',
            timeline: [...(order.timeline || []), timelineEntry]
        });

        await sendEmailNotification(order, 'En cours de préparation', "Demande d'annulation refusée par Trymyday.");

        showToast(`❌ Demande d'annulation refusée.`, 'info');
    };

    const handleApproveItemCancellation = async (order, itemIndex) => {
        const item = order.items[itemIndex];
        const ok = await confirm({
            title: 'Approuver l\'annulation de l\'article',
            message: `Approuver l'annulation de "${item.name}" ? ${(item.price * item.quantity).toLocaleString()} FCFA sera remboursé.`,
            variant: 'danger',
            confirmText: 'Approuver & Rembourser'
        });
        if (!ok) return;

        const refundAmount = item.price * item.quantity;
        const updatedItems = [...order.items];
        updatedItems[itemIndex] = { ...item, cancelRequested: false, cancelled: true };

        const timestamp = new Date().toLocaleString('fr-FR');
        const timelineEntry = {
            date: timestamp,
            oldStatus: order.status,
            newStatus: order.status,
            note: `Annulation de l'article "${item.name}" approuvée. Remboursement de ${refundAmount.toLocaleString()} FCFA effectué.`,
            admin: 'Trymyday'
        };

        // 1. Process Wallet Refund via API
        try {
            await authFetch(`${API_BASE_URL}/api/admin/wallet/credit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: order.email,
                    amount: refundAmount,
                    description: `Remboursement article "${item.name}" (Commande #${order.id})`
                })
            });
        } catch (e) {
            console.error("Refund failed", e);
        }

        // 2. Update Order
        const newTotal = order.total - refundAmount;
        await updateOrder(order.id, {
            items: updatedItems,
            total: newTotal,
            timeline: [...(order.timeline || []), timelineEntry]
        });

        showToast(`Article annulé et client remboursé.`, 'success');
        if (detailsOrder?.id === order.id) {
            setDetailsOrder({ ...order, items: updatedItems, total: newTotal, timeline: [...(order.timeline || []), timelineEntry] });
        }
    };

    const handleRefuseItemCancellation = async (order, itemIndex) => {
        const item = order.items[itemIndex];
        const ok = await confirm({
            title: 'Refuser l\'annulation de l\'article',
            message: `Refuser la demande d'annulation pour "${item.name}" ?`,
            variant: 'secondary'
        });
        if (!ok) return;

        const updatedItems = [...order.items];
        updatedItems[itemIndex] = { ...item, cancelRequested: false };

        const timestamp = new Date().toLocaleString('fr-FR');
        const timelineEntry = {
            date: timestamp,
            oldStatus: order.status,
            newStatus: order.status,
            note: `Demande d'annulation refusée pour l'article "${item.name}".`,
            admin: 'Trymyday'
        };

        await updateOrder(order.id, {
            items: updatedItems,
            timeline: [...(order.timeline || []), timelineEntry]
        });

        showToast(`Demande d'annulation refusée.`, 'info');
        if (detailsOrder?.id === order.id) {
            setDetailsOrder({ ...order, items: updatedItems, timeline: [...(order.timeline || []), timelineEntry] });
        }
    };

    const exportToCSV = () => {
        const headers = ['ID Commande', 'ID Client', 'Nom', 'Téléphone', 'Date', 'Montant', 'Statut', 'Lien Suivi'];
        const rows = filteredOrders.map(o => [
            o.id,
            o.customerId || o.userId || '-',
            o.customerName || o.customer || 'Client',
            o.phone || '-',
            o.date,
            `${o.total.toLocaleString()} FCFA`,
            o.status,
            o.trackingNumber || '-'
        ]);

        // Utilisation de point-virgule pour Excel FR et encodage UTF-8 BOM
        const csvContent = "\uFEFF" + [
            headers.join(';'),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', `commandes_trymyday_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div>
            {/* Statistics Cards */}
            <Row className="mb-3 g-2">
                <Col xs={6} md={3} lg>
                    <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px' }}>
                        <Card.Body className="text-center p-2 p-md-3 text-white">
                            <div className="label-lite opacity-80">Total</div>
                            <h6 className="mb-0 fw-bold value-lite">{stats.total}</h6>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3} lg>
                    <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '12px' }}>
                        <Card.Body className="text-center p-2 p-md-3 text-white">
                            <div className="label-lite opacity-80">En attente</div>
                            <h6 className="mb-0 fw-bold value-lite">{stats.pending}</h6>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3} lg>
                    <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', borderRadius: '12px' }}>
                        <Card.Body className="text-center p-2 p-md-3 text-white">
                            <div className="label-lite opacity-80">Préparation</div>
                            <h6 className="mb-0 fw-bold value-lite">{stats.inProgress}</h6>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3} lg>
                    <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', borderRadius: '12px' }}>
                        <Card.Body className="text-center p-2 p-md-3 text-white">
                            <div className="label-lite opacity-80">En route</div>
                            <h6 className="mb-0 fw-bold value-lite">{stats.shipping}</h6>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3} lg>
                    <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '12px' }}>
                        <Card.Body className="text-center p-2 p-md-3 text-white">
                            <div className="label-lite opacity-80">Livrées</div>
                            <h6 className="mb-0 fw-bold value-lite">{stats.delivered}</h6>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3} lg>
                    <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', borderRadius: '12px' }}>
                        <Card.Body className="text-center p-2 p-md-3 text-white">
                            <div className="label-lite opacity-80">Annulées</div>
                            <h6 className="mb-0 fw-bold value-lite">{stats.cancelled}</h6>
                        </Card.Body>
                    </Card>
                </Col>
                {!isManager && !isExpediteur && stats.totalRevenue > 0 && (
                    <Col xs={12} lg>
                        <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: '12px' }}>
                            <Card.Body className="text-center p-2 p-md-3 text-white">
                                <div className="label-lite opacity-80">Revenu Total</div>
                                <h6 className="mb-0 fw-bold value-lite">{stats.totalRevenue.toLocaleString()} FCFA</h6>
                            </Card.Body>
                        </Card>
                    </Col>
                )}
            </Row>

            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 mt-4">
                <h4 className="fw-bold mb-0">{t('admin_dashboard.orders', 'Gestion des Commandes')}</h4>
                <div className="d-flex gap-2">
                    <Button variant="success" onClick={exportToCSV} className="fw-bold px-3 py-2 rounded-pill shadow-sm" size="sm">
                        <i className="bi bi-download me-1"></i> Exporter CSV
                    </Button>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-3 rounded-4 shadow-sm border mb-4">
                <Row className="g-2 g-md-3">
                    <Col xs={12} md={7}>
                        <InputGroup className="shadow-none border rounded overflow-hidden">
                            <InputGroup.Text className="bg-white border-0 pe-0">
                                <i className="bi bi-search text-muted opacity-50"></i>
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Rechercher par ID ou client..."
                                className="border-0 shadow-none py-2"
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                            <Button
                                variant="white"
                                className="border-0 text-primary"
                                onClick={() => setShowScanner(true)}
                                title="Scanner un code-barre"
                            >
                                <i className="bi bi-camera-fill"></i>
                            </Button>
                        </InputGroup>
                    </Col>
                    <Col xs={12} md={5}>
                        <Form.Select className="shadow-none border rounded py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">Tous les statuts</option>
                            <option value="En attente">En attente</option>
                            <option value="En cours de préparation">En préparation</option>
                            <option value="En route">En route</option>
                            <option value="Livrée">Livrée</option>
                            <option value="Annulée">Annulée</option>
                        </Form.Select>
                    </Col>
                </Row>
            </div>

            {/* Cancellation Requests Section */}
            {orders.filter(o => o.status === "Demande d'annulation").length > 0 && (
                <div className="mb-4">
                    <h6 className="text-danger fw-bold mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        Demandes d'annulation en attente
                    </h6>
                    <Row className="g-2 g-md-3">
                        {orders.filter(o => o.status === "Demande d'annulation").map(order => (
                            <Col key={order.id} xs={12} md={6} lg={4}>
                                <Card className="border-danger shadow-sm h-100 rounded-3 overflow-hidden">
                                    <Card.Body className="p-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <div className="fw-bold text-danger">Commande #{order.id.toString().substring(0, 10)}...</div>
                                                <small className="text-muted">{order.customerName || order.customer}</small>
                                            </div>
                                            <div className="fw-bold text-dark">{order.total.toLocaleString()} FCFA</div>
                                        </div>
                                        <div className="d-flex gap-2 mt-3">
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                className="flex-grow-1 fw-bold rounded-pill"
                                                onClick={() => handleApproveCancellation(order)}
                                            >
                                                Approuver
                                            </Button>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                className="flex-grow-1 fw-bold rounded-pill"
                                                onClick={() => handleRefuseCancellation(order)}
                                            >
                                                Refuser
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="text-center text-muted py-5 bg-white border rounded-4 shadow-sm">
                    <i className="bi bi-inbox opacity-20" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-3 fw-medium">Aucune commande trouvée</p>
                </div>
            ) : (
                <>
                    {/* 📱 Mobile View (Cards) */}
                    <div className="d-md-none d-flex flex-column gap-3">
                        {filteredOrders.map(order => (
                            <Card key={order.id} className="border-0 shadow-sm rounded-4 overflow-hidden">
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                                        <div className="fw-mono text-primary fw-bold" style={{ fontSize: '0.85rem' }}>
                                            #{order.id.toString().includes('order_') ? order.id.toString().split('_')[1].substring(0, 8) : order.id}
                                        </div>
                                        <div className="text-muted small">{order.date}</div>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <div className="fw-bold text-dark mb-1">{order.customerName || order.customer || 'Client'}</div>
                                            <div className="text-muted small"><i className="bi bi-telephone me-1"></i>{order.phone || 'Non renseigné'}</div>
                                        </div>
                                        <div className="text-end">
                                            <div className="fw-black text-dark fs-5">{order.total.toLocaleString()} FCFA</div>
                                            <Badge bg={
                                                order.status === 'Livrée' || order.status === 'Livré' ? 'success' :
                                                    order.status === 'En route' ? 'info' :
                                                        order.status === 'En cours de préparation' ? 'warning' :
                                                            order.status === 'En attente' ? 'secondary' :
                                                                order.status === "Demande d'annulation" || order.status === 'Annulée' ? 'danger' : 'primary'
                                            } className="px-2 py-1 mt-1 fw-bold" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant="outline-primary"
                                            className="flex-grow-1 border p-2 rounded-3 shadow-none bg-light"
                                            onClick={() => handleStatusChange(order)}
                                        >
                                            <i className="bi bi-pencil-fill me-2"></i>Statut
                                        </Button>
                                        <Button
                                            variant="dark"
                                            className="flex-grow-1 border-0 p-2 rounded-3 shadow-none"
                                            onClick={() => {
                                                setDetailsOrder(order);
                                                setShowDetailsModal(true);
                                            }}
                                        >
                                            <i className="bi bi-eye-fill me-2"></i>Détails
                                        </Button>
                                    </div>
                                    <div className="d-none">
                                        <Barcode id={`barcode-svg-${order.id}-mobile`} value={order.id} width={1} height={40} fontSize={12} />
                                    </div>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>

                    {/* 💻 Desktop View (Table) */}
                    <div className="d-none d-md-block bg-white border rounded-4 shadow-sm overflow-hidden tech-order-table-container">
                        <Table hover responsive className="mb-0 align-middle tech-order-table">
                            <thead className="bg-light text-muted small text-uppercase">
                                <tr>
                                    <th className="ps-3 ps-md-4 py-3">{t('admin_dashboard.order_id', 'ID Commande')}</th>
                                    <th className="py-3">{t('admin_dashboard.client', 'Client')}</th>
                                    <th className="d-none d-lg-table-cell py-3">{t('admin_dashboard.client_id', 'ID Client')}</th>
                                    <th className="d-none d-xl-table-cell py-3">{t('admin_dashboard.date', 'Date')}</th>
                                    <th className="py-3 text-start">{t('admin_dashboard.amount', 'Montant')}</th>
                                    <th className="d-none d-md-table-cell py-3">Suivi</th>
                                    <th className="py-3">{t('admin_dashboard.status', 'Statut')}</th>
                                    <th className="text-end pe-3 pe-md-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => (
                                    <tr key={order.id} className="tech-order-row">
                                        <td className="ps-3 ps-md-4 py-3 border-bottom-0">
                                            <div className="fw-mono text-primary fw-bold" style={{ fontSize: '0.85rem' }}>
                                                #{order.id.toString().includes('order_') ? order.id.toString().split('_')[1].substring(0, 8) : order.id}
                                            </div>
                                        </td>
                                        <td className="py-3 border-bottom-0">
                                            <div className="fw-semibold text-dark">{order.customerName || order.customer || 'Client'}</div>
                                        </td>
                                        <td className="d-none d-lg-table-cell py-3 small text-muted border-bottom-0">
                                            {order.customerId || order.userId || '-'}
                                        </td>
                                        <td className="d-none d-xl-table-cell py-3 small text-muted border-bottom-0">{order.date}</td>
                                        <td className="py-3 text-start border-bottom-0">
                                            <div className="fw-bold text-dark">{order.total.toLocaleString()} FCFA</div>
                                        </td>
                                        <td className="d-none d-md-table-cell py-3 border-bottom-0">
                                            {order.trackingNumber ? (
                                                <Badge bg="info" className="fw-normal py-1 px-2" style={{ fontSize: '0.65rem' }}>
                                                    <i className="bi bi-truck me-1"></i>
                                                    {order.trackingNumber}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted small opacity-50">-</span>
                                            )}
                                        </td>
                                        <td className="py-3 border-bottom-0">
                                            <Badge bg={
                                                order.status === 'Livrée' || order.status === 'Livré' ? 'success' :
                                                    order.status === 'En route' ? 'info' :
                                                        order.status === 'En cours de préparation' ? 'warning' :
                                                            order.status === 'En attente' ? 'secondary' :
                                                                order.status === "Demande d'annulation" || order.status === 'Annulée' ? 'danger' : 'primary'
                                            } className="px-2 py-1.5 fw-bold" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="text-end pe-3 pe-md-4 py-3 order-actions-cell">
                                            <div className="d-flex justify-content-end gap-1">
                                                <Button
                                                    variant="outline-secondary"
                                                    className="border-0 p-2 rounded-circle shadow-none d-none d-lg-inline-block"
                                                    onClick={() => handlePrintSlip(order)}
                                                    title="Imprimer"
                                                >
                                                    <i className="bi bi-printer"></i>
                                                </Button>
                                                <Button
                                                    variant="outline-primary"
                                                    className="border-0 p-2 rounded-circle shadow-none"
                                                    onClick={() => handleStatusChange(order)}
                                                    title="Modifier statut"
                                                >
                                                    <i className="bi bi-pencil-fill"></i>
                                                </Button>
                                                <Button
                                                    variant="outline-dark"
                                                    className="border-0 p-2 rounded-circle shadow-none"
                                                    onClick={() => {
                                                        setDetailsOrder(order);
                                                        setShowDetailsModal(true);
                                                    }}
                                                    title="Détails"
                                                >
                                                    <i className="bi bi-eye-fill"></i>
                                                </Button>
                                            </div>
                                            <div className="d-none">
                                                <Barcode id={`barcode-svg-${order.id}`} value={order.id} width={1} height={40} fontSize={12} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </>
            )}

            <style>{`
                .label-lite { font-size: 0.6rem; text-transform: uppercase; font-weight: 600; }
                .value-lite { font-size: 0.9rem; }
                .tech-order-row { transition: all 0.2s; }
                .tech-order-row:hover { background-color: #f8f9fa !important; }
                
                @media (max-width: 767.98px) {
                    .value-lite { font-size: 0.8rem; }
                    .tech-order-table-container { border: none !important; box-shadow: none !important; background: transparent !important; }
                    .tech-order-table thead { display: none; }
                    .tech-order-table tbody tr { 
                        display: flex !important; 
                        flex-wrap: wrap; 
                        background: #fff; 
                        margin-bottom: 15px; 
                        border-radius: 14px; 
                        padding: 15px; 
                        border: 1px solid #eee; 
                        box-shadow: 0 4px 12px rgba(0,0,0,0.03); 
                        position: relative;
                        align-items: center;
                    }
                    .tech-order-table td { border: none !important; padding: 0 !important; }
                    .order-id-cell { width: auto; flex-grow: 1; margin-bottom: 6px; }
                    .order-customer-cell { width: 100%; margin-bottom: 12px; }
                    .order-amount-cell { width: auto; margin-right: 15px; }
                    .order-status-cell { width: auto; }
                    .order-actions-cell { position: absolute; top: 15px; right: 10px; width: auto !important; }
                }
            `}</style>

            {/* Status Change Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Modifier le statut - Commande #{selectedOrder?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Statut actuel</Form.Label>
                            <Form.Control value={selectedOrder?.status || ''} disabled />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Nouveau statut *</Form.Label>
                            <Form.Select id="newStatus" defaultValue={selectedOrder?.status}>
                                <option value="En attente">En attente</option>
                                <option value="En cours de préparation">En cours de préparation</option>
                                <option value="En route">En route</option>
                                <option value="Livrée">Livrée</option>
                                <option value="Annulée">Annulée</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Numéro de suivi</Form.Label>
                            <Form.Control
                                placeholder="Ex: DHL123456789"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                            />
                            <Form.Text className="text-muted">
                                Optionnel - Le client pourra suivre sa commande
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Note pour le client</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Ex: Votre colis est en cours de préparation..."
                                value={statusNote}
                                onChange={(e) => setStatusNote(e.target.value)}
                            />
                            <Form.Text className="text-muted">
                                Cette note sera visible par le client dans l'historique de sa commande
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Annuler
                    </Button>
                    <Button variant="primary" onClick={saveStatusChange}>
                        Enregistrer
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Order Details Modal */}
            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Détails Commande #{detailsOrder?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    {detailsOrder && (
                        <div className="d-flex flex-column gap-4">
                            {/* Status and Summary Header */}
                            <div className="bg-light p-3 rounded-3 d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small mb-1">Date de commande</div>
                                    <div className="fw-bold">{detailsOrder.date}</div>
                                </div>
                                <div className="text-end">
                                    <Badge bg={
                                        detailsOrder.status === 'Livrée' || detailsOrder.status === 'Livré' ? 'success' :
                                            detailsOrder.status === 'En route' ? 'info' :
                                                detailsOrder.status === 'En cours de préparation' ? 'warning' :
                                                    detailsOrder.status === 'En attente' ? 'secondary' : 'danger'
                                    } className="px-3 py-2 fs-6">
                                        {detailsOrder.status}
                                    </Badge>
                                    <div className="mt-1 fw-bold text-success fs-5">
                                        Total: {detailsOrder.total.toLocaleString()} FCFA
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div>
                                <h6 className="fw-bold border-bottom pb-2 mb-3">Informations Client</h6>
                                <Row className="g-3">
                                    <Col sm={6}>
                                        <div className="text-muted small">Nom :</div>
                                        <div className="fw-medium">{detailsOrder.customerName || detailsOrder.customer || 'N/A'}</div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="text-muted small">Téléphone :</div>
                                        <div className="fw-medium">{detailsOrder.phone || 'N/A'}</div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="text-muted small">Email :</div>
                                        <div className="fw-medium">{detailsOrder.email || 'N/A'}</div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="text-muted small">ID Client :</div>
                                        <div className="fw-medium">{(() => {
                                            // Chercher l'utilisateur à partir de l'email
                                            const users = JSON.parse(localStorage.getItem('users') || '[]');
                                            const orderUser = users.find(u => u.email === detailsOrder.email);
                                            return orderUser?.id || detailsOrder.customerId || detailsOrder.userId || 'N/A';
                                        })()}</div>
                                    </Col>
                                    <Col sm={12}>
                                        <div className="text-muted small">Adresse de livraison :</div>
                                        <div className="fw-medium bg-light p-2 rounded mt-1">
                                            {detailsOrder.shippingAddress ? (
                                                <>
                                                    {detailsOrder.shippingAddress.fullName && <>{detailsOrder.shippingAddress.fullName}<br /></>}
                                                    {detailsOrder.shippingAddress.address}<br />
                                                    {detailsOrder.shippingAddress.city}, {detailsOrder.shippingAddress.country} <br />
                                                    {detailsOrder.shippingAddress.postalCode && <>{detailsOrder.shippingAddress.postalCode}<br /></>}
                                                    {detailsOrder.shippingAddress.phone || detailsOrder.phone}
                                                </>
                                            ) : (
                                                <span className="text-muted fst-italic">Adresse non disponible</span>
                                            )}
                                        </div>
                                    </Col>
                                </Row>
                            </div>

                            {/* Items List */}
                            <div>
                                <h6 className="fw-bold border-bottom pb-2 mb-3">Articles ({detailsOrder.items?.length || 0})</h6>
                                <div className="d-flex flex-column gap-3">
                                    {detailsOrder.items?.map((item, idx) => (
                                        <div key={idx} className="d-flex align-items-center border-bottom pb-3 last-border-0">
                                            <div className="bg-light rounded p-1 border me-3" style={{ width: '60px', height: '60px' }}>
                                                <img src={item.image} alt={item.name} className="w-100 h-100 object-fit-contain" />
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="fw-bold text-truncate" style={{ maxWidth: '300px' }}>{item.name}</div>
                                                <div className="text-muted small">
                                                    Prix u. : {parseFloat(item.price).toLocaleString()} FCFA
                                                    {item.size && <span className="ms-2 badge bg-light text-dark border">Taille: {item.size}</span>}
                                                    {item.color && (
                                                        <span className="ms-1 d-inline-block border rounded-circle"
                                                            style={{ width: '10px', height: '10px', backgroundColor: item.color }}
                                                            title={item.color}
                                                        ></span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-end">
                                                <div className="fw-bold">x{item.quantity}</div>
                                                <div className="fw-bold text-primary">{(parseFloat(item.price) * item.quantity).toLocaleString()} FCFA</div>

                                                {item.cancelRequested && (
                                                    <div className="mt-2 d-flex flex-column gap-1">
                                                        <Badge bg="warning" text="dark" className="mb-1">Annulation demandée</Badge>
                                                        <div className="d-flex gap-1">
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                className="px-1 py-0"
                                                                style={{ fontSize: '0.7rem' }}
                                                                onClick={() => handleApproveItemCancellation(detailsOrder, idx)}
                                                            >
                                                                Approuver
                                                            </Button>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                className="px-1 py-0"
                                                                style={{ fontSize: '0.7rem' }}
                                                                onClick={() => handleRefuseItemCancellation(detailsOrder, idx)}
                                                            >
                                                                Refuser
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                                {item.cancelled && (
                                                    <Badge bg="danger" className="mt-2">Annulé</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="outline-dark" onClick={() => handlePrintSlip(detailsOrder)}>
                        <i className="bi bi-printer me-2"></i>Imprimer la fiche
                    </Button>
                    <Button variant="light" onClick={() => setShowDetailsModal(false)}>Fermer</Button>
                </Modal.Footer>
            </Modal>
            {/* Barcode Scanner Modal */}
            <BarcodeScanner
                show={showScanner}
                onHide={() => setShowScanner(false)}
                onScan={(code) => setSearchTerm(code)}
            />
        </div>
    );
};

export const AdminUsers = () => {
    const { users } = useData();
    return (
        <div>
            <h2 className="mb-4">Gestion des Clients</h2>
            <Table hover responsive>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Inscrit le</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td className="fw-bold">{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                                <Badge bg={user.role === 'admin' ? 'danger' : 'info'}>
                                    {user.role}
                                </Badge>
                            </td>
                            <td>{user.joined}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};
export const AdminSupport = () => {
    const { helpQuestions, updateHelpQuestion, deleteHelpQuestion } = useData();
    const { showToast, confirm } = useToast();
    const [selectedQ, setSelectedQ] = useState(null);
    const [answerText, setAnswerText] = useState('');
    const [showAnswerModal, setShowAnswerModal] = useState(false);

    const handleAnswer = (q) => {
        setSelectedQ(q);
        setAnswerText(q.answer || '');
        setShowAnswerModal(true);
    };

    const saveAnswer = () => {
        if (!selectedQ) return;
        updateHelpQuestion(selectedQ.id, {
            answer: answerText,
            status: 'approved' // Auto-approve when answered
        });
        setShowAnswerModal(false);
    };

    const toggleStatus = (q) => {
        const newStatus = q.status === 'approved' ? 'pending' : 'approved';
        updateHelpQuestion(q.id, { status: newStatus });
    };

    const pendingCount = helpQuestions.filter(q => q.status === 'pending').length;

    return (
        <div className="tech-support-container">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <h3 className="mb-0 fw-bold">Support & Communauté</h3>
                {pendingCount > 0 && (
                    <Badge bg="danger" pill className="px-3 py-2 shadow-sm animate__animated animate__pulse animate__infinite">
                        {pendingCount} Question{pendingCount > 1 ? 's' : ''} en attente
                    </Badge>
                )}
            </div>

            <div className="bg-white border rounded-4 shadow-sm overflow-hidden tech-support-list-container">
                <Table hover responsive className="align-middle mb-0 tech-support-table">
                    <thead className="bg-light d-none d-md-table-header-group">
                        <tr>
                            <th className="ps-4 py-3">Date</th>
                            <th className="py-3">Utilisateur</th>
                            <th className="py-3">Question</th>
                            <th className="py-3">Statut</th>
                            <th className="py-3">Réponse</th>
                            <th className="text-end pe-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {helpQuestions.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-5 text-muted bg-white">
                                    <i className="bi bi-chat-square-dots opacity-25 fs-1 d-block mb-2"></i>
                                    Aucune question pour le moment.
                                </td>
                            </tr>
                        ) : (
                            helpQuestions.map(q => (
                                <tr key={q.id} className="tech-support-row">
                                    <td className="ps-3 ps-md-4 py-3 support-date-cell">
                                        <div className="small text-muted">{q.date}</div>
                                    </td>
                                    <td className="py-3 support-user-cell fw-bold text-primary">{q.userName}</td>
                                    <td className="py-3 support-question-cell" style={{ maxWidth: '300px' }}>
                                        <div className="text-dark small lh-sm">{q.question}</div>
                                    </td>
                                    <td className="py-3 support-status-cell">
                                        <Badge
                                            bg={q.status === 'approved' ? 'success' : 'warning'}
                                            className="px-2 py-1 rounded-pill"
                                            onClick={() => toggleStatus(q)}
                                            style={{ cursor: 'pointer', fontSize: '0.65rem', textTransform: 'uppercase' }}
                                        >
                                            {q.status === 'approved' ? 'Approuvée' : 'En attente'}
                                        </Badge>
                                    </td>
                                    <td className="py-3 support-answer-cell" style={{ maxWidth: '250px' }}>
                                        {q.answer ? (
                                            <div className="text-truncate small text-muted" title={q.answer}>{q.answer}</div>
                                        ) : (
                                            <span className="fst-italic text-danger small">Pas de réponse</span>
                                        )}
                                    </td>
                                    <td className="text-end pe-3 pe-md-4 py-3 support-actions-cell">
                                        <div className="d-flex justify-content-end gap-1">
                                            <Button
                                                variant="outline-primary"
                                                className="border-0 p-2 rounded-circle shadow-none"
                                                onClick={() => handleAnswer(q)}
                                                title="Répondre"
                                            >
                                                <i className="bi bi-chat-left-dots-fill"></i>
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                className="border-0 p-2 rounded-circle shadow-none"
                                                onClick={async () => {
                                                    const ok = await confirm({
                                                        title: 'Supprimer la question',
                                                        message: 'Supprimer cette question ?',
                                                        variant: 'danger',
                                                        confirmText: 'Supprimer'
                                                    });
                                                    if (ok) {
                                                        deleteHelpQuestion(q.id);
                                                        showToast('Question supprimée', 'success');
                                                    }
                                                }}
                                                title="Supprimer"
                                            >
                                                <i className="bi bi-trash-fill"></i>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>

            <style>{`
                .tech-support-row { transition: all 0.2s ease; border-bottom: 1px solid #f8f9fa; }
                .tech-support-row:hover { background-color: #fcfcfc !important; }
                
                @media (max-width: 767.98px) {
                    .tech-support-list-container { border: none !important; box-shadow: none !important; background: transparent !important; }
                    .tech-support-table thead { display: none; }
                    .tech-support-table tbody tr { 
                        display: flex !important; 
                        flex-wrap: wrap; 
                        background: #fff; 
                        margin-bottom: 12px; 
                        border-radius: 16px; 
                        padding: 15px; 
                        border: 1px solid #eee; 
                        box-shadow: 0 4px 12px rgba(0,0,0,0.02); 
                        position: relative;
                        align-items: center;
                    }
                    .tech-support-table td { border: none !important; padding: 0 !important; }
                    .support-date-cell { width: 100%; margin-bottom: 4px; border-bottom: 1px dashed #eee !important; padding-bottom: 6px !important; }
                    .support-user-cell { width: 100%; margin-bottom: 6px; font-size: 1.1rem; }
                    .support-question-cell { width: 100%; margin-bottom: 10px; background: #f8f9fa; padding: 10px !important; border-radius: 8px; }
                    .support-status-cell { width: auto; margin-right: 15px; }
                    .support-answer-cell { width: 100%; margin-top: 10px; border-top: 1px solid #f8f9fa !important; padding-top: 8px !important; }
                    .support-actions-cell { position: absolute; top: 12px; right: 10px; width: auto !important; }
                }
            `}</style>

            {/* Answer Modal */}
            <Modal show={showAnswerModal} onHide={() => setShowAnswerModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Répondre</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    <div className="mb-3">
                        <label className="text-muted small mb-1">Question de {selectedQ?.userName} :</label>
                        <div className="p-3 bg-light rounded-4 fw-medium border-start border-primary border-4">{selectedQ?.question}</div>
                    </div>
                    <Form.Group>
                        <label className="fw-bold mb-2 small text-uppercase">Votre Réponse</label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            placeholder="Écrivez votre réponse ici..."
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            className="rounded-4 border-0 bg-light shadow-none"
                            style={{ padding: '15px' }}
                        />
                        <div className="mt-2 small text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            La question sera automatiquement approuvée.
                        </div>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={() => setShowAnswerModal(false)} className="rounded-pill px-4">Fermer</Button>
                    <Button variant="primary" onClick={saveAnswer} disabled={!answerText.trim()} className="rounded-pill px-4" style={{ background: '#ef9c52', borderColor: '#ef9c52' }}>
                        Enregistrer
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};


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
