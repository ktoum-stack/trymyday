import { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import TranslatedText from '../components/TranslatedText';

const Register = () => {
    const location = useLocation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { user, register } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate('/profile', { replace: true });
        }
    }, [user, navigate]);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await register(name, email, password);
            if (result.success) {
                const redirectFrom = location.state?.from || '/profile/orders';
                navigate(redirectFrom, { replace: true });
            } else {
                setError(result.message || t('auth.error_register'));
            }
        } catch (err) {
            setError(t('auth.error_server'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="p-0 overflow-hidden" style={{ minHeight: 'calc(100vh - 70px)' }}>
            <Row className="g-0" style={{ minHeight: 'calc(100vh - 70px)' }}>
                {/* Left Side: Welcome Image & Text (Hidden on mobile) */}
                <Col md={6} lg={7} className="d-none d-md-flex align-items-center justify-content-center bg-dark position-relative">
                    <div 
                        className="position-absolute w-100 h-100" 
                        style={{ 
                            backgroundImage: 'url("/assets/hero_banner_1766034909755.png")', 
                            backgroundSize: 'cover', 
                            backgroundPosition: 'center',
                            opacity: '0.6'
                        }}
                    ></div>
                    <div className="position-relative text-white text-center p-5">
                        <h1 className="display-3 fw-bold mb-4">{t('common.welcome')} <br/><span className="text-warning">TRY MY DAY</span></h1>
                        <p className="lead fs-3 mb-4">
                            <TranslatedText>L'excellence au service de votre quotidien.</TranslatedText>
                        </p>
                        <div className="d-flex justify-content-center gap-3">
                            <div className="bg-warning text-dark p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                <i className="bi bi-bag-check-fill fs-3"></i>
                            </div>
                            <div className="bg-white text-dark p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                <i className="bi bi-star-fill fs-3 text-warning"></i>
                            </div>
                            <div className="bg-warning text-dark p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                <i className="bi bi-shield-check fs-3"></i>
                            </div>
                        </div>
                    </div>
                </Col>

                {/* Right Side: Registration Form */}
                <Col xs={12} md={6} lg={5} className="d-flex align-items-center justify-content-center bg-light px-4 py-5">
                    <Card style={{ width: '100%', maxWidth: '450px' }} className="shadow-lg border-0 rounded-4 overflow-hidden">
                        <Card.Body className="p-4 p-md-5">
                            <div className="text-center mb-4 d-md-none">
                                <h3 className="fw-bold text-warning">TRY MY DAY</h3>
                            </div>
                            
                            <h2 className="text-center mb-2 fw-bold">{t('auth.register_title')}</h2>
                            <p className="text-center text-muted mb-4 small">Commencez votre expérience dès aujourd'hui</p>

                            {error && <Alert variant="danger" className="py-2 small mb-4">{error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold text-secondary small">{t('auth.name_label')}</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Jean Dupont"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        style={{ fontSize: '1rem', padding: '12px', borderRadius: '8px' }}
                                        required
                                        disabled={loading}
                                        className="bg-light border-0"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold text-secondary small">{t('auth.email_label')}</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="votre@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{ fontSize: '1rem', padding: '12px', borderRadius: '8px' }}
                                        required
                                        disabled={loading}
                                        className="bg-light border-0"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-semibold text-secondary small">{t('auth.password_label')}</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Choisissez un mot de passe"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ fontSize: '1rem', padding: '12px', borderRadius: '8px' }}
                                        required
                                        disabled={loading}
                                        className="bg-light border-0"
                                    />
                                </Form.Group>

                                <Button
                                    variant="warning"
                                    type="submit"
                                    className="w-100 py-3 fw-bold mb-3 text-white border-0 shadow-sm"
                                    style={{ borderRadius: '10px', fontSize: '1.1rem', transition: 'all 0.3s ease' }}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            {t('common.loading')}
                                        </>
                                    ) : t('auth.register_btn')}
                                </Button>
                            </Form>

                            <div className="text-center mt-4">
                                <p className="mb-0 text-muted small">
                                    {t('auth.have_account')} <Link to="/login" className="fw-bold text-warning text-decoration-none">{t('auth.login_link')}</Link>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Register;
