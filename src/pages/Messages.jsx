import { Card, Button, Row, Col, Form, Badge, ListGroup } from 'react-bootstrap';
import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileLayout from '../components/ProfileLayout';
import { useLanguage } from '../context/LanguageContext';

const Messages = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Mock conversations
    const [conversations] = useState([
        {
            id: 1,
            vendorName: 'TechStore',
            vendorAvatar: '🏪',
            lastMessage: 'Votre commande a été expédiée !',
            lastMessageTime: '2025-01-20 14:30',
            unread: 2,
            messages: [
                { id: 1, sender: 'vendor', text: 'Bonjour ! Comment puis-je vous aider ?', time: '2025-01-20 10:00' },
                { id: 2, sender: 'user', text: 'Bonjour, j\'ai une question sur ma commande #12345', time: '2025-01-20 10:15' },
                { id: 3, sender: 'vendor', text: 'Bien sûr ! Laissez-moi vérifier...', time: '2025-01-20 10:16' },
                { id: 4, sender: 'vendor', text: 'Votre commande a été expédiée !', time: '2025-01-20 14:30' }
            ]
        },
        {
            id: 2,
            vendorName: 'FashionHub',
            vendorAvatar: '👗',
            lastMessage: 'Merci pour votre achat !',
            lastMessageTime: '2025-01-19 16:45',
            unread: 0,
            messages: [
                { id: 1, sender: 'vendor', text: 'Merci pour votre achat !', time: '2025-01-19 16:45' },
                { id: 2, sender: 'user', text: 'De rien, merci à vous !', time: '2025-01-19 17:00' }
            ]
        },
        {
            id: 3,
            vendorName: 'HomeDecor',
            vendorAvatar: '🏠',
            lastMessage: 'Le produit est disponible en bleu également',
            lastMessageTime: '2025-01-18 11:20',
            unread: 1,
            messages: [
                { id: 1, sender: 'user', text: 'Avez-vous ce produit en bleu ?', time: '2025-01-18 11:00' },
                { id: 2, sender: 'vendor', text: 'Le produit est disponible en bleu également', time: '2025-01-18 11:20' }
            ]
        }
    ]);

    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        // In a real app, this would send the message to the backend
        showToast(t('messages.send_success'), 'success');
        setNewMessage('');
    };

    const formatTime = (timeString) => {
        const date = new Date(timeString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return t('messages.yesterday');
        } else if (diffDays < 7) {
            return t('messages.days_ago').replace('{days}', diffDays);
        } else {
            return date.toLocaleDateString();
        }
    };

    if (!user) {
        return (
            <ProfileLayout>
                <div className="mb-4">
                    <h3 className="fw-bold">{t('messages.title')}</h3>
                    <p className="text-muted">{t('messages.subtitle')}</p>
                </div>
                <Card className="border-0 shadow-sm text-center p-5">
                    <i className="bi bi-person-x" style={{ fontSize: '4rem', color: '#ddd' }}></i>
                    <h5 className="mt-3">{t('messages.login_required')}</h5>
                    <p className="text-muted">{t('messages.login_msg')}</p>
                    <Button variant="warning" className="text-white mt-2" onClick={() => navigate('/login')}>
                        {t('messages.login_btn')}
                    </Button>
                </Card>
            </ProfileLayout>
        );
    }

    return (
        <ProfileLayout>
            <div className="mb-4">
                <h3 className="fw-bold">{t('messages.title')}</h3>
                <p className="text-muted">{t('messages.subtitle')}</p>
            </div>

            <Row>
                {/* Conversations List */}
                <Col md={4}>
                    <Card className="border-0 shadow-sm" style={{ height: '600px', overflowY: 'auto' }}>
                        <Card.Header className="bg-white border-bottom">
                            <h6 className="mb-0 fw-bold">{t('messages.conversations')}</h6>
                        </Card.Header>
                        <ListGroup variant="flush">
                            {conversations.length === 0 ? (
                                <div className="text-center p-4">
                                    <i className="bi bi-chat-dots" style={{ fontSize: '3rem', color: '#ddd' }}></i>
                                    <p className="text-muted mt-3 mb-0">{t('messages.no_conversations')}</p>
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <ListGroup.Item
                                        key={conv.id}
                                        action
                                        active={selectedConversation?.id === conv.id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className="border-0"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-start">
                                            <div className="me-3" style={{ fontSize: '2rem' }}>
                                                {conv.vendorAvatar}
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-start mb-1">
                                                    <h6 className="mb-0 fw-bold">{conv.vendorName}</h6>
                                                    {conv.unread > 0 && (
                                                        <Badge bg="danger" pill>{conv.unread}</Badge>
                                                    )}
                                                </div>
                                                <p className="mb-1 small text-muted text-truncate">
                                                    {conv.lastMessage}
                                                </p>
                                                <small className="text-muted">{formatTime(conv.lastMessageTime)}</small>
                                            </div>
                                        </div>
                                    </ListGroup.Item>
                                ))
                            )}
                        </ListGroup>
                    </Card>
                </Col>

                {/* Chat Area */}
                <Col md={8}>
                    {selectedConversation ? (
                        <Card className="border-0 shadow-sm" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                            {/* Chat Header */}
                            <Card.Header className="bg-white border-bottom">
                                <div className="d-flex align-items-center">
                                    <div className="me-3" style={{ fontSize: '2rem' }}>
                                        {selectedConversation.vendorAvatar}
                                    </div>
                                    <div>
                                        <h6 className="mb-0 fw-bold">{selectedConversation.vendorName}</h6>
                                        <small className="text-muted">En ligne</small>
                                    </div>
                                </div>
                            </Card.Header>

                            {/* Messages */}
                            <Card.Body style={{ flex: 1, overflowY: 'auto' }} className="p-3">
                                {selectedConversation.messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`d-flex mb-3 ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                                    >
                                        <div
                                            className={`p-3 rounded ${msg.sender === 'user'
                                                ? 'bg-warning text-white'
                                                : 'bg-light'
                                                }`}
                                            style={{ maxWidth: '70%' }}
                                        >
                                            <p className="mb-1">{msg.text}</p>
                                            <small className={msg.sender === 'user' ? 'text-white-50' : 'text-muted'}>
                                                {new Date(msg.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                            </small>
                                        </div>
                                    </div>
                                ))}
                            </Card.Body>

                            {/* Message Input */}
                            <Card.Footer className="bg-white border-top">
                                <Form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="text"
                                            placeholder={t('messages.input_placeholder')}
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                        <Button variant="warning" type="submit" className="text-white">
                                            <i className="bi bi-send-fill"></i>
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Footer>
                        </Card>
                    ) : (
                        <Card className="border-0 shadow-sm text-center p-5" style={{ height: '600px' }}>
                            <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                <i className="bi bi-chat-text" style={{ fontSize: '5rem', color: '#ddd' }}></i>
                                <h5 className="mt-4 text-muted">{t('messages.select_conv')}</h5>
                                <p className="text-muted">{t('messages.select_conv_msg')}</p>
                            </div>
                        </Card>
                    )}
                </Col>
            </Row>
        </ProfileLayout>
    );
};

export default Messages;
