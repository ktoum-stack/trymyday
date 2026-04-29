import { Container, Row, Col, Card, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import ProfileLayout from '../components/ProfileLayout';
import { useLanguage } from '../context/LanguageContext';

const Cards = () => {
    const { user } = useAuth();
    const { showToast, confirm } = useToast();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [showCardModal, setShowCardModal] = useState(false);
    const [editingCard, setEditingCard] = useState(null);

    // Load saved cards
    const [savedCards, setSavedCards] = useState(() => {
        if (!user) return [];
        const saved = localStorage.getItem(`cards_${user.email}`);
        return saved ? JSON.parse(saved) : [];
    });

    const [cardData, setCardData] = useState({
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: '',
        isDefault: false
    });

    // Redirect if not logged in
    if (!user) {
        return (
            <Container className="py-5 text-center">
                <Alert variant="light" className="border">
                    <Alert.Heading>{t('favorites_page.login_required')}</Alert.Heading>
                    <p>{t('cart.login_to_checkout')}</p>
                    <Button variant="warning" className="text-white" onClick={() => navigate('/login')}>
                        {t('auth.login_btn')}
                    </Button>
                </Alert>
            </Container>
        );
    }

    // Save cards to localStorage
    const saveCards = (cards) => {
        if (user) {
            localStorage.setItem(`cards_${user.email}`, JSON.stringify(cards));
            setSavedCards(cards);
        }
    };

    // Add or update card
    const handleSaveCard = () => {
        if (!cardData.cardNumber || !cardData.cardHolder || !cardData.expiryDate || !cardData.cvv) {
            showToast(t('cards.fill_all'), 'warning');
            return;
        }

        if (editingCard) {
            // Update existing card
            const updatedCards = savedCards.map(card =>
                card.id === editingCard.id
                    ? {
                        ...card,
                        cardNumber: cardData.cardNumber,
                        cardHolder: cardData.cardHolder,
                        expiryDate: cardData.expiryDate,
                        lastFour: cardData.cardNumber.slice(-4),
                        isDefault: cardData.isDefault
                    }
                    : card
            );
            saveCards(updatedCards);
        } else {
            // Add new card
            const newCard = {
                id: Date.now().toString(),
                cardNumber: cardData.cardNumber,
                cardHolder: cardData.cardHolder,
                expiryDate: cardData.expiryDate,
                lastFour: cardData.cardNumber.slice(-4),
                isDefault: cardData.isDefault || savedCards.length === 0,
                addedDate: new Date().toISOString()
            };

            // If this is set as default, remove default from others
            let baseCards = savedCards;
            if (newCard.isDefault) {
                baseCards = savedCards.map(card => ({ ...card, isDefault: false }));
            }

            saveCards([...baseCards, newCard]);
        }

        showToast(editingCard ? t('cards.edit_success') : t('cards.add_success'), 'success');
        resetForm();
    };

    // Delete card
    const handleDeleteCard = async (id) => {
        const ok = await confirm({
            title: t('cards.delete_confirm_title'),
            message: t('cards.delete_confirm_msg'),
            variant: 'danger',
            confirmText: t('common.delete')
        });

        if (ok) {
            const newCards = savedCards.filter(card => card.id !== id);
            saveCards(newCards);
            showToast(t('cards.delete_success'), 'success');
        }
    };

    // Set as default card
    const handleSetDefault = (id) => {
        const updatedCards = savedCards.map(card => ({
            ...card,
            isDefault: card.id === id
        }));
        saveCards(updatedCards);
        showToast(t('cards.default_updated'), 'success');
    };

    // Reset form
    const resetForm = () => {
        setCardData({
            cardNumber: '',
            cardHolder: '',
            expiryDate: '',
            cvv: '',
            isDefault: false
        });
        setEditingCard(null);
        setShowCardModal(false);
    };

    // Edit card
    const handleEditCard = (card) => {
        setEditingCard(card);
        setCardData({
            cardNumber: card.cardNumber,
            cardHolder: card.cardHolder,
            expiryDate: card.expiryDate,
            cvv: '***',
            isDefault: card.isDefault
        });
        setShowCardModal(true);
    };

    return (
        <ProfileLayout>
            <h3 className="mb-4 fw-bold">
                <i className="bi bi-credit-card me-2"></i>
                {t('cards.title')}
            </h3>
# (re-translating specific "Mes cartes bancaires" if I find a better key)

            {savedCards.length === 0 ? (
                <Card className="border-0 shadow-sm text-center p-5">
                    <i className="bi bi-credit-card" style={{ fontSize: '4rem', color: '#ddd' }}></i>
                    <h5 className="mt-3 text-muted">{t('cards.no_cards')}</h5>
                    <p className="text-muted">{t('cards.add_first')}</p>
                    <Button variant="warning" className="text-white mt-2" onClick={() => setShowCardModal(true)}>
                        <i className="bi bi-plus-circle me-2"></i>
                        {t('cards.add_btn')}
                    </Button>
                </Card>
            ) : (
                <>
                    <div className="mb-3">
                        <Button variant="warning" className="text-white" onClick={() => setShowCardModal(true)}>
                            <i className="bi bi-plus-circle me-2"></i>
                            {t('cards.add_btn')}
                        </Button>
                    </div>

                    <Row className="g-3">
                        {savedCards.map(card => (
                            <Col md={6} key={card.id}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Body className="p-4">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <i className="bi bi-credit-card-2-front" style={{ fontSize: '2rem', color: '#ffc107' }}></i>
                                            </div>
                                            {card.isDefault && (
                                                <Badge bg="success">{t('cards.default_badge')}</Badge>
                                            )}
                                        </div>

                                        <div className="mb-3">
                                            <h5 className="mb-1">•••• •••• •••• {card.lastFour}</h5>
                                            <p className="text-muted mb-0">{card.cardHolder}</p>
                                            <small className="text-muted">{t('cards.expire_label')}: {card.expiryDate}</small>
                                        </div>

                                        <div className="d-flex gap-2">
                                            {!card.isDefault && (
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => handleSetDefault(card.id)}
                                                >
                                                    {t('cards.set_default_btn')}
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDeleteCard(card.id)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </>
            )}

            {/* Add/Edit Card Modal */}
            <Modal show={showCardModal} onHide={resetForm} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingCard ? t('cards.edit_modal_title') : t('cards.add_modal_title')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>{t('cards.card_number_label')} *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="1234 5678 9012 3456"
                                value={cardData.cardNumber}
                                onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value.replace(/\s/g, '') })}
                                maxLength="16"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('cards.card_holder_label')} *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="NOM PRENOM"
                                value={cardData.cardHolder}
                                onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value.toUpperCase() })}
                            />
                        </Form.Group>

                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('cards.expiry_date_label')} *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="MM/AA"
                                        value={cardData.expiryDate}
                                        onChange={(e) => {
                                            let value = e.target.value.replace(/\D/g, '');
                                            if (value.length >= 2) {
                                                value = value.slice(0, 2) + '/' + value.slice(2, 4);
                                            }
                                            setCardData({ ...cardData, expiryDate: value });
                                        }}
                                        maxLength="5"
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('cards.cvv_label')} *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="123"
                                        value={cardData.cvv}
                                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })}
                                        maxLength="3"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label={t('cards.set_default_checkbox')}
                                checked={cardData.isDefault}
                                onChange={(e) => setCardData({ ...cardData, isDefault: e.target.checked })}
                            />
                        </Form.Group>
# (re-translating specific "Définir comme carte par défaut" message if I find a better key)
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={resetForm}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="warning" className="text-white" onClick={handleSaveCard}>
                        {editingCard ? t('common.edit') : t('common.add')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </ProfileLayout>
    );
};

export default Cards;
