import { Card, Button, Row, Col, Modal, Form, Alert } from 'react-bootstrap';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import ProfileLayout from '../components/ProfileLayout';
import { useLanguage } from '../context/LanguageContext';

const SavedCards = () => {
    const { user } = useAuth();
    const { showToast, confirm } = useToast();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [showModal, setShowModal] = useState(false);
    const [editingCard, setEditingCard] = useState(null);

    // Load cards from localStorage
    const [cards, setCards] = useState(() => {
        if (!user) return [];
        const saved = localStorage.getItem(`cards_${user.email}`);
        return saved ? JSON.parse(saved) : [];
    });

    const [formData, setFormData] = useState({
        cardName: '',
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: ''
    });

    // Redirect if not logged in
    if (!user) {
        return (
            <ProfileLayout>
                <div className="mb-4">
                    <h3 className="fw-bold">{t('saved_cards.title')}</h3>
                    <p className="text-muted">{t('saved_cards.subtitle')}</p>
                </div>
                <Alert variant="info">
                    <Alert.Heading>{t('saved_cards.login_required')}</Alert.Heading>
                    <p>{t('saved_cards.login_msg')}</p>
                    <Button variant="primary" onClick={() => navigate('/login')}>
                        {t('saved_cards.login_btn')}
                    </Button>
                </Alert>
            </ProfileLayout>
        );
    }

    const saveCards = (newCards) => {
        setCards(newCards);
        localStorage.setItem(`cards_${user.email}`, JSON.stringify(newCards));
    };

    const handleOpenModal = (card = null) => {
        if (card) {
            setEditingCard(card);
            setFormData(card);
        } else {
            setEditingCard(null);
            setFormData({ cardName: '', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' });
        }
        setShowModal(true);
    };

    const handleSaveCard = () => {
        if (!formData.cardName || !formData.cardNumber || !formData.expiryMonth || !formData.expiryYear) {
            showToast(t('saved_cards.fill_required'), 'warning');
            return;
        }
        if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
            showToast(t('saved_cards.invalid_number'), 'warning');
            return;
        }

        let newCards;
        if (editingCard) {
            newCards = cards.map(c => c.id === editingCard.id ? { ...formData, id: editingCard.id } : c);
        } else {
            newCards = [...cards, { ...formData, id: Date.now() }];
        }

        saveCards(newCards);
        showToast(editingCard ? t('saved_cards.updated') : t('saved_cards.added'), 'success');
        setShowModal(false);
    };

    const handleDeleteCard = async (id) => {
        const ok = await confirm({
            title: t('saved_cards.delete_title'),
            message: t('saved_cards.delete_msg'),
            variant: 'danger',
            confirmText: t('common.delete')
        });
        if (ok) {
            saveCards(cards.filter(c => c.id !== id));
            showToast(t('saved_cards.deleted'), 'success');
        }
    };

    const maskCardNumber = (number) => {
        const cleaned = number.replace(/\s/g, '');
        return `**** **** **** ${cleaned.slice(-4)}`;
    };

    const getCardType = (number) => {
        const cleaned = number.replace(/\s/g, '');
        if (cleaned.startsWith('4')) return 'Visa';
        if (cleaned.startsWith('5')) return 'Mastercard';
        if (cleaned.startsWith('3')) return 'American Express';
        return t('saved_cards.generic_card');
    };

    const formatCardNumber = (value) => {
        const cleaned = value.replace(/\s/g, '');
        const chunks = cleaned.match(/.{1,4}/g);
        return chunks ? chunks.join(' ') : cleaned;
    };

    return (
        <ProfileLayout>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold">{t('saved_cards.title')}</h3>
                    <p className="text-muted mb-0">{t('saved_cards.subtitle')}</p>
                </div>
                <Button variant="warning" className="text-white fw-bold" onClick={() => handleOpenModal()}>
                    <i className="bi bi-plus-lg me-2"></i>
                    {t('saved_cards.new_card')}
                </Button>
            </div>

            {cards.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-credit-card" style={{ fontSize: '5rem', color: '#ddd' }}></i>
                    <h3 className="mt-4 text-muted">{t('saved_cards.no_cards')}</h3>
                    <p className="text-muted mb-4">{t('saved_cards.no_cards_msg')}</p>
                    <Button variant="warning" className="text-white fw-bold" onClick={() => handleOpenModal()}>
                        {t('saved_cards.add_card')}
                    </Button>
                </div>
            ) : (
                <Row className="g-4">
                    {cards.map(card => (
                        <Col key={card.id} md={6} lg={4}>
                            <Card className="h-100 shadow-sm border-0" style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white'
                            }}>
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-4">
                                        <div>
                                            <small className="opacity-75">{getCardType(card.cardNumber)}</small>
                                            <h6 className="fw-bold mb-0">{card.cardName}</h6>
                                        </div>
                                        <div>
                                            <Button variant="link" size="sm" className="p-1 text-white" onClick={() => handleOpenModal(card)}>
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                            <Button variant="link" size="sm" className="p-1 text-white" onClick={() => handleDeleteCard(card.id)}>
                                                <i className="bi bi-trash-fill"></i>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <i className="bi bi-credit-card-2-front" style={{ fontSize: '2rem' }}></i>
                                    </div>
                                    <p className="mb-2 fw-bold" style={{ fontSize: '1.1rem', letterSpacing: '2px' }}>
                                        {maskCardNumber(card.cardNumber)}
                                    </p>
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <small className="opacity-75">{t('saved_cards.expires')}</small>
                                            <p className="mb-0 fw-bold">{card.expiryMonth}/{card.expiryYear}</p>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Add/Edit Card Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingCard ? t('saved_cards.edit_modal_title') : t('saved_cards.add_modal_title')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>{t('saved_cards.field_name')} *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ex: JEAN DUPONT"
                                value={formData.cardName}
                                onChange={e => setFormData({ ...formData, cardName: e.target.value.toUpperCase() })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('saved_cards.field_number')} *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="1234 5678 9012 3456"
                                maxLength="19"
                                value={formatCardNumber(formData.cardNumber)}
                                onChange={e => {
                                    const value = e.target.value.replace(/\s/g, '');
                                    if (/^\d*$/.test(value) && value.length <= 16) {
                                        setFormData({ ...formData, cardNumber: value });
                                    }
                                }}
                            />
                        </Form.Group>

                        <Row>
                            <Col xs={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('saved_cards.field_month')} *</Form.Label>
                                    <Form.Select value={formData.expiryMonth} onChange={e => setFormData({ ...formData, expiryMonth: e.target.value })}>
                                        <option value="">MM</option>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                            <option key={month} value={month.toString().padStart(2, '0')}>
                                                {month.toString().padStart(2, '0')}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col xs={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('saved_cards.field_year')} *</Form.Label>
                                    <Form.Select value={formData.expiryYear} onChange={e => setFormData({ ...formData, expiryYear: e.target.value })}>
                                        <option value="">AA</option>
                                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                                            <option key={year} value={year.toString().slice(-2)}>
                                                {year.toString().slice(-2)}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col xs={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>CVV</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="123"
                                        maxLength="3"
                                        value={formData.cvv}
                                        onChange={e => {
                                            const value = e.target.value;
                                            if (/^\d*$/.test(value)) setFormData({ ...formData, cvv: value });
                                        }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Alert variant="info" className="small">
                            <i className="bi bi-shield-lock me-2"></i>
                            {t('saved_cards.security_msg')}
                        </Alert>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="warning" className="text-white fw-bold" onClick={handleSaveCard}>
                        {t('common.save')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </ProfileLayout>
    );
};

export default SavedCards;
