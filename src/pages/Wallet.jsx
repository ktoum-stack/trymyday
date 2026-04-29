import { Row, Col, Card, Alert, Badge, Form, Button, InputGroup, Modal } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import ProfileLayout from '../components/ProfileLayout';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../config';

const Wallet = () => {
    const { user } = useAuth();
    const { balance, transactions, loading, fetchBalance, fetchTransactions } = useWallet();
    const [transferData, setTransferData] = useState({ toId: '', amount: '', description: '' });
    const [transferStatus, setTransferStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const { t, language } = useLanguage();

    const [visibleTransactions, setVisibleTransactions] = useState(5);

    useEffect(() => {
        if (user) {
            fetchBalance();
            fetchTransactions();
        }
    }, [user]);

    const handleTransfer = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTransferStatus({ type: '', message: '' });

        if (parseFloat(transferData.amount) > balance) {
            setTransferStatus({ type: 'danger', message: t('wallet.insufficient_balance') });
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await authFetch(`${API_BASE_URL}/api/wallet/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromEmail: user.email,
                    toEmail: transferData.toId,
                    amount: parseFloat(transferData.amount),
                    description: transferData.description || `${t('wallet.transfer')} de ${user.name}`
                })
            });

            const data = await response.json();

            if (data.success) {
                setTransferStatus({ type: 'success', message: t('wallet.transfer_success') });
                setTransferData({ toId: '', amount: '', description: '' });
                setTimeout(() => {
                    setShowTransferModal(false);
                    setTransferStatus({ type: '', message: '' });
                }, 2000);
                fetchBalance();
                fetchTransactions();
            } else {
                setTransferStatus({ type: 'danger', message: data.message || t('wallet.transfer_error') });
            }
        } catch (error) {
            setTransferStatus({ type: 'danger', message: t('wallet.server_error') });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return (
            <div className="py-5 text-center">
                <Alert variant="warning">
                    <Alert.Heading>{t('favorites_page.login_required')}</Alert.Heading>
                    <p>{t('cart.login_to_checkout')}</p>
                </Alert>
            </div>
        );
    }

    return (
        <ProfileLayout>
            <h3 className="mb-4 fw-bold">
                <i className="bi bi-coin me-2"></i>
                {t('wallet.title')}
            </h3>

            <Row className="g-4">
                {/* Compact Mini-Wallet Card */}
                <Col lg={5} md={7} xs={12}>
                    <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px', borderLeft: '4px solid #ff6000' }}>
                        <Card.Body className="p-3">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-3">
                                        <i className="bi bi-wallet2 text-warning fs-5"></i>
                                    </div>
                                    <div>
                                        <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>{t('wallet.balance')}</small>
                                        <h4 className="fw-bolder mb-0 text-dark">{(balance !== undefined ? balance : 0).toLocaleString()} <span className="fs-6 fw-normal">FCFA</span></h4>
                                    </div>
                                </div>
                                <Button
                                    variant="outline-warning"
                                    size="sm"
                                    className="rounded-pill px-3 py-1 fw-bold"
                                    style={{ fontSize: '0.75rem', borderWidth: '1.5px' }}
                                    onClick={() => setShowTransferModal(true)}
                                >
                                    <i className="bi bi-arrow-left-right me-1"></i>
                                    {t('wallet.transfer')}
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Transactions History - Below card on mobile, Right on desktop */}
                <Col lg={8}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white p-3 border-bottom">
                            <h6 className="mb-0 fw-bold text-dark">
                                <i className="bi bi-clock-history me-2 text-warning"></i>
                                {t('wallet.history')}
                            </h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {loading ? (
                                <div className="text-center p-5">
                                    <div className="spinner-border text-warning" role="status">
                                        <span className="visually-hidden">{t('common.loading')}</span>
                                    </div>
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="text-center p-5 text-muted">
                                    <i className="bi bi-receipt mb-3 d-block" style={{ fontSize: '3rem' }}></i>
                                    <p>{t('wallet.no_transactions')}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="list-group list-group-flush">
                                        {transactions.slice(0, visibleTransactions).map((tx) => {
                                            const isCancelled = tx.description?.toLowerCase().includes('annulée');
                                            const balanceBefore = tx.type === 'credit' ? tx.balanceAfter - tx.amount : tx.balanceAfter + tx.amount;
                                            const operator = tx.type === 'credit' ? '+' : '-';

                                            return (
                                                <div key={tx.id} className={`list-group-item p-3 ${isCancelled ? 'bg-light bg-opacity-50' : ''}`}>
                                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                        <div className="flex-grow-1">
                                                            <div className="d-flex align-items-center mb-1 flex-wrap gap-2">
                                                                <Badge bg={isCancelled ? 'secondary' : (tx.type === 'credit' ? 'success' : 'danger')} className="px-2" style={{ borderRadius: '6px', fontSize: '0.7rem' }}>
                                                                    {isCancelled ? (
                                                                        <><i className="bi bi-x-circle me-1"></i> {t('wallet.cancelled')}</>
                                                                    ) : tx.description?.toLowerCase().includes('remboursement') ? (
                                                                        <><i className="bi bi-arrow-return-left me-1"></i> {t('wallet.refund')}</>
                                                                    ) : tx.type === 'credit' ? (
                                                                        <><i className="bi bi-arrow-down-circle me-1"></i> {t('wallet.transfer').toUpperCase()}</>
                                                                    ) : (
                                                                        <><i className="bi bi-cart-check me-1"></i> {t('wallet.purchase')}</>
                                                                    )}
                                                                </Badge>
                                                                <span className={`fw-bold ${isCancelled ? 'text-muted text-decoration-line-through' : (tx.type === 'credit' ? 'text-success' : 'text-danger')}`} style={{ fontSize: '0.95rem' }}>
                                                                    {operator}{tx.amount.toLocaleString()} FCFA
                                                                </span>
                                                            </div>
                                                            <div className={`fw-bold mb-0 small ${isCancelled ? 'text-muted' : 'text-dark'}`}>
                                                                {tx.description.replace(/credit/gi, 'Transfert').replace(/virement admin/gi, 'Transfert TRYMYDAY')}
                                                            </div>
                                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                                <i className="bi bi-calendar3 me-1"></i>
                                                                {new Date(tx.date).toLocaleString(language === 'AR' ? 'ar-EG' : language === 'EN' ? 'en-US' : 'fr-FR', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </div>

                                                        <div className="bg-white p-2 rounded-3 border shadow-sm" style={{ minWidth: '180px' }}>
                                                            <div className="d-flex flex-column gap-0">
                                                                <div className="d-flex justify-content-between" style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                                                    <span>{t('wallet.old_balance')}:</span>
                                                                    <span>{balanceBefore.toLocaleString()} FCFA</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between fw-bold" style={{ fontSize: '0.75rem' }}>
                                                                    <span>{tx.type === 'credit' ? `${t('wallet.received')}:` : `${t('wallet.debit')}:`}</span>
                                                                    <span className={isCancelled ? 'text-decoration-line-through' : (tx.type === 'credit' ? 'text-success' : 'text-danger')}>
                                                                        {operator}{tx.amount.toLocaleString()} FCFA
                                                                    </span>
                                                                </div>
                                                                <hr className="my-1 opacity-25" />
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <span className="fw-bold" style={{ fontSize: '0.75rem' }}>{t('wallet.new_balance')} :</span>
                                                                    <span className={`fw-bold ${isCancelled ? 'text-muted' : 'text-warning'}`} style={{ fontSize: '0.9rem' }}>
                                                                        {tx.balanceAfter.toLocaleString()} FCFA
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {transactions.length > visibleTransactions && (
                                        <div className="p-3 text-center bg-light border-top">
                                            <Button
                                                variant="link"
                                                className="text-warning fw-bold text-decoration-none"
                                                onClick={() => setVisibleTransactions(prev => prev + 10)}
                                            >
                                                {t('wallet.view_more')} <i className="bi bi-plus-lg ms-1"></i>
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Transfer Modal */}
            <Modal
                show={showTransferModal}
                onHide={() => setShowTransferModal(false)}
                centered
                className="animate__animated animate__fadeIn"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">
                        <i className="bi bi-send me-2 text-warning"></i>{t('wallet.transfer_modal_title')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {transferStatus.message && (
                        <Alert variant={transferStatus.type} className="animate__animated animate__fadeIn">
                            {transferStatus.message}
                        </Alert>
                    )}

                    <Form onSubmit={handleTransfer}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">{t('wallet.account_id_label')} (ex: 5RMEEQUT)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder={t('wallet.account_id_placeholder')}
                                value={transferData.toId}
                                onChange={(e) => setTransferData({ ...transferData, toId: e.target.value })}
                                required
                                className="bg-light border-0"
                            />
                            <Form.Text className="text-muted small">
                                {t('wallet.id_help')}
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">{t('wallet.amount_label')} (FCFA)</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder={t('wallet.amount_placeholder')}
                                value={transferData.amount}
                                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                                required
                                min="1"
                                className="bg-light border-0"
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">{t('wallet.description_label')}</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                placeholder={t('wallet.description_placeholder')}
                                value={transferData.description}
                                onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
                                className="bg-light border-0"
                            />
                        </Form.Group>

                        <Button
                            variant="warning"
                            type="submit"
                            className="w-100 fw-bold py-2 text-white shadow-sm"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    {t('common.loading')}
                                </>
                            ) : (
                                t('wallet.confirm_transfer')
                            )}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Barcode Scanner Modal removed as per request */}
        </ProfileLayout>
    );
};

export default Wallet;


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
