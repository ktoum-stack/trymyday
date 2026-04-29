import { Container, Row, Col, Card, Form, Button, Table, Badge, Alert, Modal } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import API_BASE_URL from '../../config';

const AdminWalletManagement = () => {
    const { t } = useLanguage();
    const { user: authUser } = useAuth();
    const { showToast, confirm } = useToast();
    const navigate = useNavigate();

    if (authUser?.role === 'expediteur') {
        navigate('/admin');
        return null;
    }

    const { balance: managerBalance, fetchBalance: refreshManagerBalance } = useWallet();
    const isManager = authUser?.role === 'manager';

    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [txSearchTerm, setTxSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState('month'); // month, 3months, 6months, year, all
    const [showVirementModal, setShowVirementModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [virementAmount, setVirementAmount] = useState('');
    const [virementDescription, setVirementDescription] = useState('');
    const [isIdVirement, setIsIdVirement] = useState(false);
    const [directUserId, setDirectUserId] = useState('');
    const [foundUser, setFoundUser] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null); // New state for details modal
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch data from backend
    const fetchData = async () => {
        setLoading(true);
        try {
            // Load users from backend
            const userRes = await authFetch(`${API_BASE_URL}/api/admin/wallet/users`);
            if (userRes.ok) {
                const userData = await userRes.json();
                if (userData.success) {
                    setUsers(userData.users || []);
                }
            }

            // Load transactions from backend
            const txRes = await authFetch(`${API_BASE_URL}/api/admin/wallet/history`);
            if (txRes.ok) {
                const txData = await txRes.json();
                if (txData.success) {
                    setTransactions(txData.transactions || []);
                }
            }
        } catch (error) {
            console.error('Error fetching data from API:', error);
            showToast('Erreur lors du chargement des données de l\'API', 'danger');
        } finally {
            setLoading(false);
        }
    };

    // Virement user wallet
    const handleVirementWallet = async () => {
        const targetUser = isIdVirement ? foundUser : selectedUser;
        if (!targetUser || !virementAmount || parseFloat(virementAmount) <= 0) {
            showToast('Veuillez remplir tous les champs correctement', 'warning');
            return;
        }

        const ok = await confirm({
            title: 'Confirmer le virement',
            message: `Êtes-vous sûr de vouloir effectuer un virement de ${parseFloat(virementAmount).toLocaleString()} FCFA à ${targetUser.name} (${targetUser.id}) ?`,
            variant: 'warning',
            confirmText: 'Confirmer le virement'
        });

        if (!ok) return;

        setIsProcessing(true);
        try {
            const amount = parseFloat(virementAmount);
            const targetEmail = isIdVirement ? (foundUser?.email) : selectedUser?.email;

            if (isManager && targetEmail === authUser.email) {
                showToast('Vous ne pouvez pas vous envoyer des fonds à vous-même', 'danger');
                setIsProcessing(false);
                return;
            }

            // 1. Appel API Backend
            let response;
            if (isManager) {
                response = await authFetch(`${API_BASE_URL}/api/wallet/transfer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fromEmail: authUser.email,
                        toEmail: targetEmail,
                        amount: amount,
                        description: virementDescription || 'Virement Manager'
                    }),
                });
            } else {
                response = await authFetch(`${API_BASE_URL}/api/admin/wallet/credit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: targetEmail,
                        userId: isIdVirement ? directUserId : selectedUser?.id,
                        amount: amount,
                        description: virementDescription || 'Virement TRYMYDAY'
                    }),
                });
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message);
            }

            if (isManager) refreshManagerBalance();

            showToast(`Virement de ${amount.toLocaleString()} FCFA effectué avec succès !`, 'success');
            handleCloseModal();
            fetchData();
        } catch (error) {
            showToast('Erreur lors de la mise à jour du solde : ' + error.message, 'danger');
            handleCloseModal();
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Undo a transaction
    const handleUndoTransaction = async (transactionId) => {
        const ok = await confirm({
            title: 'Annuler la transaction',
            message: "Êtes-vous sûr de vouloir annuler cette transaction ? Le montant sera déduit du solde de l'utilisateur.",
            variant: 'danger',
            confirmText: 'Annuler la transaction'
        });

        if (!ok) return;

        try {
            const response = await authFetch(`${API_BASE_URL}/api/admin/wallet/undo-transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId }),
            });

            const result = await response.json();
            if (result.success) {
                showToast('Transaction annulée avec succès', 'success');
                fetchData();
            } else {
                showToast(`Erreur: ${result.message}`, 'danger');
            }
        } catch (error) {
            showToast('Erreur lors de l\'annulation', 'danger');
            console.error(error);
        }
    };

    // Filter users based on search
    // Handle direct ID search (Modified to search by Phone or ID)
    useEffect(() => {
        if (isIdVirement && directUserId) {
            const user = users.find(u =>
                (u.phone && String(u.phone).includes(directUserId.trim())) ||
                (u.id && String(u.id).toLowerCase() === directUserId.trim().toLowerCase())
            );
            setFoundUser(user || null);
        } else {
            setFoundUser(null);
        }
    }, [directUserId, isIdVirement, users]);

    // Handle modal close
    const handleCloseModal = () => {
        setShowVirementModal(false);
        setIsIdVirement(false);
        setDirectUserId('');
        setFoundUser(null);
        setVirementAmount('');
        setVirementDescription('');
        setSelectedUser(null);
        setIsProcessing(false);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.id && String(user.id).toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.name && String(user.name).toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.phone && String(user.phone).includes(searchTerm)); // Include phone in global search

        if (isManager && user.email === authUser.email) return false;
        return matchesSearch;
    });



    // Filter transactions based on search and manager restrictions
    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch =
            (tx.userEmail && String(tx.userEmail).toLowerCase().includes(txSearchTerm.toLowerCase())) ||
            (tx.userId && String(tx.userId).toLowerCase().includes(txSearchTerm.toLowerCase())) || // Added userId search
            (tx.description && String(tx.description).toLowerCase().includes(txSearchTerm.toLowerCase())) ||
            (tx.amount !== undefined && tx.amount !== null && String(tx.amount).includes(txSearchTerm)) ||
            (tx.type && String(tx.type).toLowerCase().includes(txSearchTerm.toLowerCase()));

        // Restriction pour les managers : 30 derniers jours (déjà appliqué par timeFilter ci-dessous si défaut, mais on garde la logique métier si nécessaire)
        // Ici on applique le filtre de temps sélectionné par l'admin
        let matchesDate = true;
        if (timeFilter !== 'all') {
            const dateLimit = new Date();
            if (timeFilter === 'month') dateLimit.setMonth(dateLimit.getMonth() - 1);
            if (timeFilter === '3months') dateLimit.setMonth(dateLimit.getMonth() - 3);
            if (timeFilter === '6months') dateLimit.setMonth(dateLimit.getMonth() - 6);
            if (timeFilter === 'year') dateLimit.setFullYear(dateLimit.getFullYear() - 1);

            matchesDate = new Date(tx.date || Date.now()) >= dateLimit;
        }

        return matchesSearch && matchesDate;
    });

    // Export transactions to CSV
    const exportTransactionsCSV = () => {
        if (transactions.length === 0) {
            showToast('Aucune transaction à exporter', 'warning');
            return;
        }

        const headers = ['Date', 'Type', 'ID', 'Nom', 'Téléphone', 'Montant', 'Description', 'Solde Après'];
        const rows = filteredTransactions.map(tx => {
            const user = users.find(u => u.id === tx.userId || u.email === tx.userEmail);
            return [
                new Date(tx.date || Date.now()).toLocaleDateString('fr-FR'),
                tx.type === 'credit' ? 'Virement' : 'Débit',
                user?.id || tx.userId || '-',
                user?.name || '-',
                user?.phone || '-',
                `${(tx.amount || 0).toLocaleString()} FCFA`,
                tx.description || '',
                `${(tx.balanceAfter || 0).toLocaleString()} FCFA`
            ];
        });

        const csvContent = "\uFEFF" + [
            headers.join(';'),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', `transactions_trymyday_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <Container fluid className="pb-4 pt-0">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <div>
                    <h3 className="fw-bold mb-0">
                        <i className="bi bi-wallet2 me-2 text-warning"></i>
                        {t('admin_wallet_mgt.title', 'Gestion des Portefeuilles')}
                    </h3>
                    {isManager && (
                        <p className="text-muted small mb-0 mt-1 d-none d-md-block">
                            Gérez les soldes clients en utilisant votre solde de manager.
                        </p>
                    )}
                </div>

                <div className="d-flex align-items-center gap-3">
                    {isManager && (
                        <div className="d-flex align-items-center bg-white border border-info-subtle shadow-sm px-3 py-2 rounded-3">
                            <div className="me-3">
                                <div className="text-muted" style={{ fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SOLDE MANAGER</div>
                                <div className="fw-bold text-dark fs-5">{managerBalance.toLocaleString()} FCFA</div>
                            </div>
                            <div className="bg-info-subtle p-2 rounded-circle text-info">
                                <i className="bi bi-wallet2"></i>
                            </div>
                        </div>
                    )}

                    <Badge bg="dark" className="px-3 py-2 fs-6 shadow-sm" style={{ borderRadius: '8px' }}>
                        {users.length} {t('admin_users.user', 'Clients')}s
                    </Badge>
                </div>
            </div>

            <Row className="mb-3 g-2">
                <Col xs={12}>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center bg-white p-3 p-md-2 rounded-4 shadow-sm border gap-3">
                        <div className="d-flex align-items-center gap-2 px-md-2">
                            <h6 className="mb-0 fw-bold text-muted d-none d-md-block">Actions:</h6>
                            <Button
                                variant="warning"
                                className="text-white fw-bold px-4 py-2 flex-grow-1 flex-md-grow-0"
                                style={{ borderRadius: '10px' }}
                                onClick={() => {
                                    setIsIdVirement(true);
                                    setShowVirementModal(true);
                                }}
                            >
                                <i className="bi bi-person-badge me-2"></i>
                                {t('admin_wallet_mgt.transfer_by_id', 'Virement par ID')}
                            </Button>
                        </div>
                        <div className="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
                            <div className="d-flex gap-2">
                                <Form.Select
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value)}
                                    style={{ borderRadius: '10px' }}
                                    className="bg-white text-muted fw-bold shadow-none border py-2 flex-grow-1 flex-md-grow-0"
                                >
                                    <option value="month">Mois</option>
                                    <option value="3months">3m</option>
                                    <option value="6months">6m</option>
                                    <option value="year">1an</option>
                                    <option value="all">Tout</option>
                                </Form.Select>
                                <Button
                                    variant="outline-success"
                                    onClick={exportTransactionsCSV}
                                    className="border rounded-3"
                                    style={{ borderRadius: '10px' }}
                                >
                                    <i className="bi bi-file-earmark-spreadsheet"></i>
                                </Button>
                            </div>
                            <div className="position-relative flex-grow-1" style={{ minWidth: 'unset' }}>
                                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted opacity-50"></i>
                                <Form.Control
                                    type="text"
                                    placeholder="Rechercher transaction..."
                                    className="ps-5 border bg-light shadow-none py-2"
                                    style={{ borderRadius: '10px' }}
                                    value={txSearchTerm}
                                    onChange={(e) => setTxSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            <Row className="g-4">
                <Col xs={12}>
                    <Card className="border-0 shadow-sm overflow-hidden tech-wallet-card" style={{ borderRadius: '20px' }}>
                        <Card.Header className="bg-white p-3 border-bottom-0 d-none d-md-block">
                            <h5 className="mb-0 fw-bold">{t('admin_wallet_mgt.history', 'Historique des Transactions')}</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive-container">
                                <Table hover className="align-middle mb-0 tech-wallet-table">
                                    <thead className="bg-light text-muted small text-uppercase d-none d-md-table-header-group">
                                        <tr>
                                            <th className="ps-4 py-3">{t('admin_dashboard.date', 'Date')}</th>
                                            <th className="py-3">{t('admin_wallet_mgt.user', 'Utilisateur')}</th>
                                            <th className="py-3">{t('admin_wallet_mgt.type', 'Type')}</th>
                                            <th className="py-3">Description</th>
                                            <th className="py-3">{t('admin_dashboard.amount', 'Montant')}</th>
                                            <th className="py-3">{t('admin_wallet_mgt.balance', 'Solde')}</th>
                                            <th className="text-end pe-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTransactions.length > 0 ? (
                                            filteredTransactions.map((tx) => {
                                                const u = users.find(usr => usr.email === tx.userEmail || usr.id === tx.userId);
                                                return (
                                                    <tr key={tx.id} className="tech-wallet-row">
                                                        <td className="ps-3 ps-md-4 py-3 wallet-date-cell">
                                                            <div className="text-muted small">
                                                                {new Date(tx.date).toLocaleDateString('fr-FR', {
                                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                                })}
                                                                <span className="d-none d-md-inline ms-1 opacity-50">
                                                                    {new Date(tx.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 wallet-user-cell">
                                                            <div className="d-flex align-items-center">
                                                                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2 text-muted border" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>
                                                                    {u?.avatar || '👤'}
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold text-dark small">{u?.name || 'Client'}</div>
                                                                    <div className="text-muted d-none d-md-block" style={{ fontSize: '0.65rem' }}>ID: {u?.id || tx.userId}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 wallet-type-cell">
                                                            <Badge bg={tx.status === 'cancelled' ? 'secondary' : (tx.type === 'credit' ? 'success' : 'danger')} className="px-2 py-1 rounded-pill" style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>
                                                                {tx.status === 'cancelled' ? 'ANNULÉE' : (tx.type === 'credit' ? 'VIREMENT' : 'ACHAT')}
                                                            </Badge>
                                                        </td>
                                                        <td className="d-none d-lg-table-cell py-3">
                                                            <div className="small text-muted text-truncate" style={{ maxWidth: '150px' }}>
                                                                {tx.description}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 wallet-amount-cell">
                                                            <div className={`fw-bold ${tx.status === 'cancelled' ? 'text-decoration-line-through text-muted' : (tx.type === 'credit' ? 'text-success' : 'text-danger')}`}>
                                                                {tx.type === 'credit' ? '+' : '-'}{(tx.amount || 0).toLocaleString()} <small>FCFA</small>
                                                            </div>
                                                        </td>
                                                        <td className="d-none d-sm-table-cell py-3">
                                                            <div className="fw-bold text-dark small">{(tx.balanceAfter || 0).toLocaleString()} <small>FCFA</small></div>
                                                        </td>
                                                        <td className="text-end pe-3 pe-md-4 py-3 wallet-actions-cell">
                                                            <div className="d-flex align-items-center justify-content-end gap-1">
                                                                <Button
                                                                    variant="light"
                                                                    className="p-2 rounded-circle border-0 bg-transparent text-primary"
                                                                    onClick={() => setSelectedTransaction(tx)}
                                                                    title="Détails"
                                                                >
                                                                    <i className="bi bi-eye-fill"></i>
                                                                </Button>
                                                                {tx.type === 'credit' && tx.status !== 'cancelled' && (
                                                                    <Button
                                                                        variant="light"
                                                                        className="p-2 rounded-circle border-0 bg-transparent text-danger"
                                                                        onClick={() => handleUndoTransaction(tx.id)}
                                                                        title="Annuler"
                                                                    >
                                                                        <i className="bi bi-x-circle-fill"></i>
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center p-5 text-muted">
                                                    <i className="bi bi-search fs-1 d-block mb-3 opacity-10"></i>
                                                    Aucune transaction trouvée
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <style>{`
                .tech-wallet-row { transition: all 0.2s ease; border-bottom: 1px solid #f8f9fa; }
                .tech-wallet-row:hover { background-color: #fcfcfc !important; }
                
                @media (max-width: 767.98px) {
                    .tech-wallet-card { background: transparent !important; box-shadow: none !important; border: none !important; }
                    .tech-wallet-table thead { display: none; }
                    .tech-wallet-table tbody tr { 
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
                    .tech-wallet-table td { border: none !important; padding: 0 !important; }
                    .wallet-date-cell { width: 100%; margin-bottom: 8px; border-bottom: 1px dashed #eee !important; padding-bottom: 6px !important; }
                    .wallet-user-cell { width: auto; flex-grow: 1; }
                    .wallet-type-cell { width: auto; margin-right: 15px; }
                    .wallet-amount-cell { width: 100%; margin-top: 10px; padding-top: 8px !important; border-top: 1px solid #f8f9fa !important; }
                    .wallet-actions-cell { position: absolute; top: 12px; right: 10px; width: auto !important; }
                }
            `}</style>

            {/* Virement Modal */}
            <Modal show={showVirementModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Faire un Virement</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    {(selectedUser || isIdVirement) && (
                        <>
                            {isIdVirement && !foundUser && (
                                <Form.Group className="mb-4">
                                    <Form.Label className="small fw-bold text-muted">ID DU CLIENT</Form.Label>
                                    <div className="position-relative">
                                        <i className="bi bi-person-badge position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                                        <Form.Control
                                            type="text"
                                            placeholder="Ex: 84930215"
                                            className="ps-5 py-2 border-0 bg-light fw-bold"
                                            style={{ borderRadius: '10px' }}
                                            value={directUserId}
                                            onChange={(e) => setDirectUserId(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    {directUserId && !foundUser && (
                                        <small className="text-danger mt-1 d-block animate__animated animate__shakeX">
                                            Aucun client trouvé avec cet ID
                                        </small>
                                    )}
                                </Form.Group>
                            )}

                            {(selectedUser || foundUser) && (
                                <div className="bg-light p-3 rounded-4 mb-4 d-flex align-items-center">
                                    <div className="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '45px', height: '45px', fontSize: '1.5rem' }}>
                                        {(isIdVirement ? foundUser.avatar : selectedUser.avatar) || '👤'}
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h6 className="fw-bold mb-0">{(isIdVirement ? foundUser.name : selectedUser.name)}</h6>
                                            <Badge bg="warning" text="dark" className="small">ID: {(isIdVirement ? foundUser.id : selectedUser.id)}</Badge>
                                        </div>
                                        <div className="mt-1">
                                            <small className="fw-bold text-dark">Solde actuel: {((isIdVirement ? foundUser.walletBalance : selectedUser.walletBalance) || 0).toLocaleString()} FCFA</small>
                                        </div>
                                    </div>
                                    {isIdVirement && (
                                        <Button variant="link" className="text-muted p-0 ms-2" onClick={() => setDirectUserId('')}>
                                            <i className="bi bi-pencil-square"></i>
                                        </Button>
                                    )}
                                </div>
                            )}

                            {(selectedUser || foundUser) && (
                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold text-muted">MONTANT DU VIREMENT (FCFA)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder="0.00"
                                            className="py-2 border-0 bg-light fw-bold"
                                            style={{ borderRadius: '10px', fontSize: '1.2rem' }}
                                            value={virementAmount}
                                            onChange={(e) => setVirementAmount(e.target.value)}
                                            min="0"
                                            step="0.01"
                                            autoFocus={!isIdVirement}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-0">
                                        <Form.Label className="small fw-bold text-muted">DESCRIPTION</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Ex: Récompense fidélité"
                                            className="py-2 border-0 bg-light"
                                            style={{ borderRadius: '10px' }}
                                            value={virementDescription}
                                            onChange={(e) => setVirementDescription(e.target.value)}
                                        />
                                    </Form.Group>
                                </Form>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" className="fw-bold" onClick={handleCloseModal} style={{ borderRadius: '10px' }} disabled={isProcessing}>
                        Annuler
                    </Button>
                    {(selectedUser || foundUser) && (
                        <Button
                            variant="warning"
                            className="text-white fw-bold px-4"
                            onClick={handleVirementWallet}
                            style={{ borderRadius: '10px' }}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Traitement...
                                </>
                            ) : 'Confirmer le virement'}
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Transaction Details Modal */}
            <Modal show={!!selectedTransaction} onHide={() => setSelectedTransaction(null)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Détails de la Transaction</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTransaction && (() => {
                        const u = users.find(usr => usr.email === selectedTransaction.userEmail || usr.id === selectedTransaction.userId);
                        return (
                            <div className="d-flex flex-column gap-3">
                                <div className="text-center mb-3">
                                    <div className={`display-4 fw-bold ${selectedTransaction.type === 'credit' ? 'text-success' : 'text-danger'}`}>
                                        {selectedTransaction.type === 'credit' ? '+' : '-'}{(selectedTransaction.amount || 0).toLocaleString()} FCFA
                                    </div>
                                    <Badge bg={selectedTransaction.status === 'cancelled' ? 'secondary' : (selectedTransaction.type === 'credit' ? 'success' : 'danger')} className="px-3 py-2 fs-6 rounded-pill mt-2">
                                        {selectedTransaction.status === 'cancelled' ? 'ANNULÉE' : (
                                            selectedTransaction.description?.toLowerCase().includes('remboursement') ? 'REMBOURSEMENT' :
                                                selectedTransaction.type === 'credit' ? 'VIREMENT' : 'ACHAT'
                                        )}
                                    </Badge>
                                </div>

                                <div className="bg-light p-3 rounded-3">
                                    <h6 className="fw-bold text-muted small text-uppercase mb-3">Informations Client</h6>
                                    <div className="d-flex align-items-center">
                                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center me-3 border shadow-sm" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
                                            {u?.avatar || '👤'}
                                        </div>
                                        <div>
                                            <div className="fw-bold fs-5">{u?.name || 'Inconnu'}</div>
                                            <div className="text-muted small">ID: {u?.id || selectedTransaction.userId}</div>
                                            <div className="text-muted small">{u?.email || selectedTransaction.userEmail}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border rounded-3 p-3">
                                    <h6 className="fw-bold text-muted small text-uppercase mb-3">Détails</h6>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Date</span>
                                        <span className="fw-medium">
                                            {new Date(selectedTransaction.date).toLocaleDateString('fr-FR', {
                                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Description</span>
                                        <span className="fw-medium text-end" style={{ maxWidth: '60%' }}>{selectedTransaction.description}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted">Solde après tx</span>
                                        <span className="fw-bold text-dark">{(selectedTransaction.balanceAfter || 0).toLocaleString()} FCFA</span>
                                    </div>
                                </div>

                                {selectedTransaction.status === 'cancelled' && (
                                    <Alert variant="secondary" className="mb-0 small">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Cette transaction a été annulée le {new Date(selectedTransaction.cancelledAt).toLocaleDateString('fr-FR')}.
                                    </Alert>
                                )}
                            </div>
                        );
                    })()}
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={() => setSelectedTransaction(null)}>Fermer</Button>
                </Modal.Footer>
            </Modal>
        </Container >
    );
};

export default AdminWalletManagement;


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
