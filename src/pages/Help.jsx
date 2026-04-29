import { Container, Row, Col, Card, Form, Button, Accordion, InputGroup, ListGroup, Offcanvas } from 'react-bootstrap';
import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Help = () => {
    const { user } = useAuth();
    const { orders, helpQuestions, addHelpQuestion } = useData();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('contact');
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Tracking state
    const [trackingId, setTrackingId] = useState('');
    const [foundOrder, setFoundOrder] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Community Form state
    const [userName, setUserName] = useState('');
    const [userQuestion, setUserQuestion] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const [mobileShowDetail, setMobileShowDetail] = useState(false);

    // Scroll to top when tab changes
    const changeTab = (tabId) => {
        setActiveTab(tabId);
        setShowMobileMenu(false);
        setMobileShowDetail(true); // Open detail view on mobile
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleTrackOrder = (e) => {
        e.preventDefault();
        const order = orders.find(o => o.id === trackingId.trim() || o.id === `#${trackingId.trim()}`);
        setFoundOrder(order);
        setHasSearched(true);
    };

    const handleSubmitQuestion = (e) => {
        e.preventDefault();
        if (!userName || !userQuestion) return;
        addHelpQuestion({ userName, question: userQuestion });
        setUserName('');
        setUserQuestion('');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
    };

    const menuItems = [
        { id: 'contact', label: t('help.contact_us'), icon: 'bi-telephone' },
        { id: 'tracking', label: t('help.track_order'), icon: 'bi-box-seam' },
        { id: 'faq', label: t('help.faq'), icon: 'bi-question-circle' },
        { id: 'community', label: t('help.community'), icon: 'bi-chat-dots' },
    ];

    const contactMethods = [
        { title: t('help.contact_whatsapp'), icon: 'bi-whatsapp', color: '#25D366', action: t('help.contact_action_chat'), link: 'https://wa.me/905461941673' },
        { title: t('help.contact_call'), icon: 'bi-telephone-fill', color: '#ff6000', action: t('help.contact_action_call'), link: 'tel:+905461941673' },
        { title: t('help.contact_email'), icon: 'bi-envelope-fill', color: '#007bff', action: t('help.contact_action_send'), link: 'mailto:Trymyday235@gmail.com' }
    ];

    const activeLabel = menuItems.find(i => i.id === activeTab)?.label || '';

    return (
        <div className="help-page-wrapper" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <Container className="py-2 py-lg-4">
                {/* --- MOBILE DASHBOARD --- */}
                {/* ... existing code ... */}
                <div className="d-lg-none">
                    {!mobileShowDetail ? (
                        <>
                            {/* Mobile Dashboard Header with Back Button */}
                            <div className="mb-3 d-flex align-items-center px-1">
                                <Button 
                                    variant="light" 
                                    className="rounded-circle p-0 d-flex align-items-center justify-content-center shadow-sm me-3" 
                                    style={{ width: '40px', height: '40px', backgroundColor: '#fff', border: '1px solid #eee' }}
                                    onClick={() => navigate(-1)}
                                >
                                    <i className="bi bi-chevron-left text-dark"></i>
                                </Button>
                                <div>
                                    <h5 className="fw-800 mb-0" style={{ fontSize: '1.1rem' }}>{t('help.title')}</h5>
                                </div>
                            </div>

                            {/* Premium Support Card */}
                            <Card 
                                className="border-0 shadow-sm mb-3 overflow-hidden mx-auto text-white" 
                                style={{ 
                                    borderRadius: '20px', 
                                    background: 'linear-gradient(135deg, #f39d48 0%, #f1bb82 100%)',
                                    maxWidth: '420px'
                                }}
                            >
                                <Card.Body className="p-3 text-center">
                                    <div 
                                        className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center shadow-sm mx-auto mb-2" 
                                        style={{ width: '45px', height: '45px', fontSize: '1.4rem', border: '2px solid rgba(255,255,255,0.3)' }}
                                    >
                                        <i className="bi bi-patch-question text-white"></i>
                                    </div>
                                    <h5 className="fw-800 mb-1" style={{ fontSize: '1.1rem' }}>{t('help.need_help')}</h5>
                                    <p className="extra-small opacity-90 mb-3">{t('help.need_help_msg')}</p>
                                    <Button
                                        href="tel:+905461941673"
                                        variant="white"
                                        className="w-100 rounded-pill py-2 fw-bold bg-white text-dark border-0 shadow-sm"
                                        style={{ fontSize: '0.85rem' }}
                                    >
                                        <i className="bi bi-telephone-fill me-2" style={{ color: '#ff6000' }}></i>
                                        {t('help.direct_call')}
                                    </Button>
                                </Card.Body>
                            </Card>

                            {/* Navigation Categories */}
                            <div className="mb-4 mx-auto" style={{ maxWidth: '420px' }}>
                                <h6 className="mb-2 fw-800 text-muted px-2" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('help.menu_title')}</h6>
                                <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '20px' }}>
                                    <ListGroup variant="flush">
                                        {menuItems.map((item, idx) => (
                                            <ListGroup.Item 
                                                key={idx} 
                                                action 
                                                className={`border-0 py-3 px-3 d-flex align-items-center justify-content-between ${activeTab === item.id ? 'bg-light' : ''}`}
                                                onClick={() => changeTab(item.id)}
                                            >
                                                <div className="d-flex align-items-center">
                                                    <div 
                                                        className="rounded-circle d-flex align-items-center justify-content-center me-3" 
                                                        style={{ 
                                                            width: '38px', height: '38px', 
                                                            backgroundColor: activeTab === item.id ? '#ff600015' : '#f3f4f6', 
                                                            color: activeTab === item.id ? '#ff6000' : '#666' 
                                                        }}
                                                    >
                                                        <i className={`bi ${item.icon} fs-5`}></i>
                                                    </div>
                                                    <span className={`fw-600 ${activeTab === item.id ? 'text-orange' : 'text-dark'}`} style={{ fontSize: '0.9rem' }}>{item.label}</span>
                                                </div>
                                                <i className={`bi bi-chevron-right small ${activeTab === item.id ? 'text-orange' : 'text-muted'}`}></i>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </Card>
                            </div>
                        </>
                    ) : (
                        /* Mobile Back Button and Title */
                        <div className="mb-4 d-flex align-items-center px-2">
                            <Button 
                                variant="light" 
                                className="rounded-circle p-0 d-flex align-items-center justify-content-center shadow-sm me-3" 
                                style={{ width: '40px', height: '40px', backgroundColor: '#fff', border: '1px solid #eee' }}
                                onClick={() => setMobileShowDetail(false)}
                            >
                                <i className="bi bi-chevron-left text-dark"></i>
                            </Button>
                            <div>
                                <div className="extra-small text-muted text-uppercase fw-bold mb-0">{t('help.title')}</div>
                                <h5 className="fw-800 mb-0" style={{ fontSize: '1.1rem' }}>{activeLabel}</h5>
                            </div>
                        </div>
                    )}
                </div>

                <Row className="justify-content-center">
                    {/* Sidebar - Desktop Only */}
                    <Col lg={3} className="d-none d-lg-block">
                        <div className="sticky-lg-top" style={{ top: '100px' }}>
                            <Card className="border-0 shadow-sm mb-4 bg-dark text-white overflow-hidden" style={{ borderRadius: '25px' }}>
                                <div style={{
                                    position: 'absolute', top: '-20px', right: '-20px',
                                    width: '100px', height: '100px', borderRadius: '50%',
                                    background: 'rgba(255, 96, 0, 0.2)', filter: 'blur(30px)'
                                }}></div>
                                <Card.Body className="p-4 position-relative">
                                    <h5 className="fw-bold mb-3 d-flex align-items-center">
                                        <i className="bi bi-question-circle me-2" style={{ color: '#ff6000' }}></i>
                                        {t('help.need_help')}
                                    </h5>
                                    <p className="small opacity-75 mb-4">{t('help.need_help_msg_alt')}</p>
                                    <Button
                                        href="tel:+905461941673"
                                        variant="warning"
                                        className="w-100 rounded-pill py-2 fw-bold shadow-sm"
                                        style={{ backgroundColor: '#ff6000', borderColor: '#ff6000', color: '#fff' }}
                                    >
                                        {t('help.direct_call')}
                                    </Button>
                                </Card.Body>
                            </Card>

                            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
                                <Card.Body className="p-3">
                                    <div className="p-2 mb-2">
                                        <h6 className="fw-bold mb-0 text-muted text-uppercase small" style={{ letterSpacing: '1px' }}>{t('help.menu_title')}</h6>
                                    </div>
                                    <ListGroup variant="flush">
                                        {menuItems.map(item => (
                                            <ListGroup.Item
                                                key={item.id}
                                                action
                                                active={activeTab === item.id}
                                                onClick={() => changeTab(item.id)}
                                                className={`border-0 rounded-4 mb-2 d-flex align-items-center py-3 px-3`}
                                                style={{
                                                    fontSize: '0.9rem',
                                                    backgroundColor: activeTab === item.id ? '#ff6000' : 'transparent',
                                                    color: activeTab === item.id ? '#fff' : '#444'
                                                }}
                                            >
                                                <i className={`bi ${item.icon} me-3 fs-5`}></i>
                                                <span className="fw-medium">{item.label}</span>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </Card.Body>
                            </Card>
                        </div>
                    </Col>

                    {/* Content Area */}
                    <Col lg={9} md={10} xs={12} className={`help-content-col ${mobileShowDetail ? 'd-block' : 'd-none d-lg-block'}`}>
                        <div className="bg-white p-3 p-md-4 p-lg-5 shadow-sm min-vh-75 main-content-card" style={{ borderRadius: '25px', marginBottom: '20px' }}>

                            {/* Tracking Content */}
                            {activeTab === 'tracking' && (
                                <div className="fade-in">
                                    <h3 className="fw-bold mb-3 mb-md-4 h4">{t('help.track_title')}</h3>
                                    <p className="text-muted mb-4 small">{t('help.track_subtitle')}</p>

                                    <div className="p-3 p-md-4 bg-light rounded-4 mb-4">
                                        <Form onSubmit={handleTrackOrder}>
                                            <div className="gap-2">
                                                <Form.Control
                                                    placeholder={t('help.track_placeholder')}
                                                    value={trackingId}
                                                    onChange={(e) => setTrackingId(e.target.value)}
                                                    style={{ height: '55px', borderRadius: '15px' }}
                                                    className="px-4 shadow-none border-0 mb-3"
                                                />
                                                <Button
                                                    variant="warning"
                                                    type="submit"
                                                    className="w-100 fw-bold shadow-sm"
                                                    style={{ borderRadius: '15px', backgroundColor: '#ff6000', borderColor: '#ff6000', color: '#fff', height: '55px' }}
                                                >
                                                    {t('help.search_btn')}
                                                </Button>
                                            </div>
                                        </Form>
                                    </div>

                                    {hasSearched && (
                                        <div className="p-3 p-md-4 rounded-4 border fade-in bg-white shadow-sm">
                                            {foundOrder ? (
                                                <Row className="align-items-center">
                                                    <Col xs={12} md={8}>
                                                        <div className="d-flex align-items-center mb-3">
                                                            <div className="bg-orange-light p-3 rounded-circle me-3 flex-shrink-0">
                                                                <i className="bi bi-box-seam text-orange fs-4"></i>
                                                            </div>
                                                            <div>
                                                                <div className="text-muted extra-small text-uppercase fw-bold">Commande #{foundOrder.id}</div>
                                                                <div className="fw-bold fs-5 text-orange">{foundOrder.status}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-muted small">{t('help.estimated_for')} {foundOrder.date}</div>
                                                    </Col>
                                                </Row>
                                            ) : (
                                                <div className="text-danger text-center py-3">
                                                    <i className="bi bi-exclamation-circle me-2"></i>
                                                    {t('help.order_not_found')}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* FAQ Content */}
                            {activeTab === 'faq' && (
                                <div className="fade-in">
                                    <h3 className="fw-bold mb-3 mb-md-4 h4">{t('help.faq')}</h3>
                                    <Accordion className="custom-help-accordion">
                                        <Accordion.Item eventKey="0" className="border-0 mb-3">
                                            <Accordion.Header className="rounded-4">{t('help.faq_q1')}</Accordion.Header>
                                            <Accordion.Body className="small opacity-75">
                                                {t('help.faq_a1')}
                                            </Accordion.Body>
                                        </Accordion.Item>
                                        <Accordion.Item eventKey="1" className="border-0 mb-3">
                                            <Accordion.Header className="rounded-4">{t('help.faq_q2')}</Accordion.Header>
                                            <Accordion.Body className="small opacity-75">
                                                {t('help.faq_a2')}
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    </Accordion>
                                </div>
                            )}

                            {/* Community Content */}
                            {activeTab === 'community' && (
                                <div className="fade-in">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h3 className="fw-bold mb-0 h4">Communauté Q&A</h3>
                                        <Button variant="dark" size="sm" className="rounded-pill px-3 fw-bold" onClick={() => document.getElementById('q-form').scrollIntoView({ behavior: 'smooth' })}>Poser</Button>
                                    </div>

                                    <div className="approved-list mb-4">
                                        {helpQuestions.filter(q => q.status === 'approved').length > 0 ? (
                                            helpQuestions.filter(q => q.status === 'approved').map(q => (
                                                <Card key={q.id} className="border-0 bg-light mb-3" style={{ borderRadius: '20px' }}>
                                                    <Card.Body className="p-3">
                                                        <div className="fw-bold small mb-2">Q: {q.question}</div>
                                                        <p className="text-muted mb-0 extra-small">{q.answer}</p>
                                                    </Card.Body>
                                                </Card>
                                            ))
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-muted small">{t('help.no_public_questions')}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div id="q-form" className="p-3 bg-light rounded-4">
                                        <Form onSubmit={handleSubmitQuestion}>
                                            <Form.Control placeholder={t('help.your_name')} className="border-0 p-3 rounded-4 mb-2 shadow-none small" value={userName} onChange={(e) => setUserName(e.target.value)} required />
                                            <Form.Control as="textarea" rows={2} placeholder={t('help.your_question')} className="border-0 p-3 rounded-4 mb-3 shadow-none small" value={userQuestion} onChange={(e) => setUserQuestion(e.target.value)} required />
                                            <Button variant="dark" type="submit" className="w-100 py-2 rounded-4 fw-bold small">{t('help.send_btn')}</Button>
                                        </Form>
                                    </div>
                                </div>
                            )}

                            {/* Contact Content */}
                            {activeTab === 'contact' && (
                                <div className="fade-in text-center">
                                    <h3 className="fw-bold mb-3 h4">Parler à un agent</h3>
                                    <p className="text-muted mb-4 small">Nous sommes disponibles pour vous assister.</p>

                                    <div className="d-flex flex-column gap-3">
                                        {contactMethods.map((m, idx) => (
                                            <Card key={idx} className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '20px' }}>
                                                <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="bg-light p-3 rounded-circle me-3" style={{ color: m.color, backgroundColor: `${m.color}15` }}>
                                                            <i className={`bi ${m.icon} fs-5`}></i>
                                                        </div>
                                                        <div className="text-start">
                                                            <div className="fw-bold small">{m.title}</div>
                                                            <div className="text-muted extra-small">{t('help.immediate_contact')}</div>
                                                        </div>
                                                    </div>
                                                    <Button variant="warning" size="sm" href={m.link} className="rounded-pill px-3 fw-bold border-0" style={{ background: m.color, color: 'white' }}>{m.action}</Button>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </Col>
                </Row>
            </Container>

            <style>{`
                .help-page-wrapper {
                    padding-bottom: 20px;
                }
                @media (max-width: 991.98px) {
                    .help-page-wrapper {
                        padding-bottom: 100px;
                    }
                    .help-content-col {
                        max-width: 480px;
                        margin-left: auto;
                        margin-right: auto;
                    }
                }
                @media (min-width: 992px) {
                    .help-content-col {
                        max-width: 100%;
                    }
                }
                .fade-in { animation: fadeIn 0.4s ease forwards; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .bg-orange { background-color: #ff6000; }
                .text-orange { color: #ff6000; }
                .bg-orange-light { background-color: rgba(255, 96, 0, 0.1); }
                .extra-small { font-size: 0.7rem; }
                .fw-800 { font-weight: 800; }
                .fw-700 { font-weight: 700; }
                .fw-600 { font-weight: 600; }
                .custom-help-accordion .accordion-button {
                    background-color: #f8f9fa;
                    border: none;
                    border-radius: 12px !important;
                    font-weight: 600;
                    margin-bottom: 5px;
                    font-size: 0.9rem;
                }
                .custom-help-accordion .accordion-button:not(.collapsed) {
                    color: #ff6000;
                    background-color: #fff !important;
                    box-shadow: none;
                }
                .min-vh-75 { min-height: 75vh; }
            `}</style>
        </div>
    );
};

export default Help;
