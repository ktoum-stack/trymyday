import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, Badge } from 'react-bootstrap';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const AdminFinance = () => {
    const { t } = useLanguage();
    const { expenses, addExpense, deleteExpense, updateExpense, orders, products } = useData();
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role === 'manager') {
            navigate('/admin');
        }
    }, [user, navigate]);

    if (user?.role === 'manager') return null;
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'Général',
        date: new Date().toISOString().split('T')[0]
    });

    const categories = ['Stock', 'Marketing', 'Logistique', 'Loyer', 'Salaires', 'Outils IT', 'Général'];

    const totalRevenue = (orders || []).reduce((acc, o) => acc + (o.total || 0), 0);

    const totalExpenses = (expenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const grossProfit = totalRevenue;
    const netProfit = grossProfit - totalExpenses;

    const handleClose = () => {
        setShowModal(false);
        setEditingExpense(null);
        setFormData({
            description: '',
            amount: '',
            category: 'Général',
            date: new Date().toISOString().split('T')[0]
        });
    };

    const handleShow = (expense = null) => {
        if (expense) {
            setEditingExpense(expense);
            setFormData({
                description: expense.description,
                amount: expense.amount,
                category: expense.category,
                date: expense.date
            });
        }
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = {
            ...formData,
            amount: Number(formData.amount)
        };

        if (editingExpense) {
            updateExpense(editingExpense.id, data);
        } else {
            addExpense(data);
        }
        handleClose();
    };

    return (
        <div className="p-1">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <h3 className="fw-bold mb-0">{t('admin_finance.title')}</h3>
                <Button
                    variant="primary"
                    onClick={() => handleShow()}
                    className="fw-bold px-4 py-2 rounded-pill shadow-sm"
                    style={{ background: '#ef9c52ff', borderColor: '#ef9c52ff' }}
                >
                    <i className="bi bi-plus-lg me-2"></i> {t('admin_finance.add_expense', 'Ajouter une dépense')}
                </Button>
            </div>

            <Row className="g-2 g-md-4 mb-4">
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm text-white h-100" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', borderRadius: '15px' }}>
                        <Card.Body className="p-3">
                            <h6 className="opacity-75 small fw-bold text-uppercase">{t('admin_dashboard.revenue')}</h6>
                            <h4 className="fw-bold mb-0" style={{ fontSize: '1.1rem' }}>{totalRevenue.toLocaleString()} <small>FCFA</small></h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm text-white h-100" style={{ background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', borderRadius: '15px' }}>
                        <Card.Body className="p-3">
                            <h6 className="opacity-75 small fw-bold text-uppercase">{t('admin_finance.purchase_cost', 'Investissement')}</h6>
                            <h4 className="fw-bold mb-0" style={{ fontSize: '1.1rem' }}>{grossProfit.toLocaleString()} <small>FCFA</small></h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm text-white h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '15px' }}>
                        <Card.Body className="p-3">
                            <h6 className="opacity-75 small fw-bold text-uppercase">{t('admin_dashboard.fixed_costs', 'Charges Fixes')}</h6>
                            <h4 className="fw-bold mb-0" style={{ fontSize: '1.1rem' }}>{totalExpenses.toLocaleString()} <small>FCFA</small></h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm text-white h-100" style={{ background: netProfit >= 0 ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' : 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', borderRadius: '15px' }}>
                        <Card.Body className="p-3">
                            <h6 className="opacity-75 small fw-bold text-uppercase">{t('admin_finance.net_profit')}</h6>
                            <h4 className="fw-bold mb-0" style={{ fontSize: '1.1rem' }}>{netProfit.toLocaleString()} <small>FCFA</small></h4>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '20px' }}>
                <Card.Header className="bg-white border-0 py-3 d-none d-md-block">
                    <h5 className="mb-0 fw-bold">{t('admin_finance.cashflow', 'Historique des Dépenses')}</h5>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive-container">
                        <Table hover className="align-middle mb-0 tech-finance-table">
                            <thead className="bg-light text-muted small text-uppercase d-none d-md-table-header-group">
                                <tr>
                                    <th className="ps-4 py-3">{t('admin_dashboard.date')}</th>
                                    <th className="py-3">Description</th>
                                    <th className="py-3">Catégorie</th>
                                    <th className="py-3">{t('admin_dashboard.amount')}</th>
                                    <th className="text-end pe-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted">
                                            <i className="bi bi-receipt fs-1 d-block mb-2 opacity-25"></i>
                                            Aucune dépense enregistrée
                                        </td>
                                    </tr>
                                ) : (
                                    expenses.map(expense => (
                                        <tr key={expense.id} className="tech-finance-row">
                                            <td className="ps-3 ps-md-4 py-3 finance-date-cell small text-muted">
                                                {new Date(expense.date).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="py-3 finance-desc-cell fw-bold text-dark">{expense.description}</td>
                                            <td className="py-3 finance-cat-cell">
                                                <Badge bg="light" text="dark" className="border px-2 py-1 rounded-pill small fw-medium">
                                                    {expense.category}
                                                </Badge>
                                            </td>
                                            <td className="py-3 finance-amount-cell fw-bold text-danger">
                                                -{Number(expense.amount).toLocaleString()} <small>FCFA</small>
                                            </td>
                                            <td className="text-end pe-3 pe-md-4 py-3 finance-actions-cell">
                                                <div className="d-flex justify-content-end gap-1">
                                                    <Button
                                                        variant="light"
                                                        className="p-2 rounded-circle border-0 bg-transparent text-primary"
                                                        onClick={() => handleShow(expense)}
                                                    >
                                                        <i className="bi bi-pencil-fill"></i>
                                                    </Button>
                                                    <Button
                                                        variant="light"
                                                        className="p-2 rounded-circle border-0 bg-transparent text-danger"
                                                        onClick={() => deleteExpense(expense.id)}
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
                </Card.Body>
            </Card>

            <style>{`
                .tech-finance-row { transition: all 0.2s ease; border-bottom: 1px solid #f8f9fa; }
                .tech-finance-row:hover { background-color: #fcfcfc !important; }
                
                @media (max-width: 767.98px) {
                    .tech-finance-table thead { display: none; }
                    .tech-finance-table tbody tr { 
                        display: flex !important; 
                        flex-wrap: wrap; 
                        background: #fff; 
                        margin-bottom: 1px; 
                        padding: 15px; 
                        position: relative;
                        align-items: center;
                    }
                    .tech-finance-table td { border: none !important; padding: 0 !important; }
                    .finance-date-cell { width: 100%; margin-bottom: 4px; font-size: 0.75rem !important; }
                    .finance-desc-cell { width: 100%; font-size: 1rem; margin-bottom: 8px; }
                    .finance-cat-cell { width: auto; margin-right: 15px; }
                    .finance-amount-cell { width: auto; flex-grow: 1; text-align: right; margin-right: 40px; }
                    .finance-actions-cell { position: absolute; bottom: 12px; right: 10px; width: auto !important; }
                }
            `}</style>

            <Modal show={showModal} onHide={handleClose} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">
                        {editingExpense ? 'Modifier la dépense' : 'Ajouter une dépense'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body className="pt-4">
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted text-uppercase">Description</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="ex: Facture électricité, Achat stock..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Montant (FCFA)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted text-uppercase">Catégorie</Form.Label>
                            <Form.Select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="light" onClick={handleClose}>Annuler</Button>
                        <Button variant="primary" type="submit" style={{ background: '#ef9c52ff', borderColor: '#ef9c52ff' }}>
                            {editingExpense ? 'Mettre à jour' : 'Enregistrer'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminFinance;
