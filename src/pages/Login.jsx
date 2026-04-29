import { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Modal } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../config';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate('/profile', { replace: true });
        }
    }, [user, navigate]);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Forgot Password States
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMessage, setForgotMessage] = useState('');

    // Message from redirect (e.g., from CartContext when not logged in)
    const redirectMessage = location.state?.message;
    const redirectFrom = location.state?.from;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                // Redirect back to where the user came from, or default to orders
                navigate(redirectFrom || '/profile/orders', { replace: true });
            } else {
                setError(result.message || t('auth.error_invalid'));
            }
        } catch (err) {
            setError(t('auth.error_server'));
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotLoading(true);
        setForgotMessage('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail })
            });
            const data = await res.json();
            setForgotMessage(data.message || 'Email envoyé');
            if (data.success) {
                setTimeout(() => {
                    setShowForgot(false);
                    setForgotMessage('');
                    setForgotEmail('');
                }, 4000);
            }
        } catch (err) {
            setForgotMessage('Erreur système');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <Card style={{ width: '400px' }} className="shadow-lg border-0">
                <Card.Body className="p-5">
                    <h2 className="text-center mb-4 fw-bold">{t('auth.login_title')}</h2>

                    {redirectMessage && <Alert variant="info" className="py-2 small">{redirectMessage}</Alert>}
                    {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label className="fw-bold" style={{ fontSize: '1.1rem' }}>{t('auth.email_label')}</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="votre@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ fontSize: '1rem', padding: '12px' }}
                                required
                                disabled={loading}
                            />
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="formBasicPassword">
                            <Form.Label className="fw-bold" style={{ fontSize: '1.1rem' }}>{t('auth.password_label')}</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ fontSize: '1rem', padding: '12px' }}
                                required
                                disabled={loading}
                            />
                        </Form.Group>

                        <div className="text-end mb-4">
                            <a href="#" className="small text-muted text-decoration-none" onClick={(e) => { e.preventDefault(); setShowForgot(true); }}>
                                {t('auth.forgot_password', 'Mot de passe oublié ?')}
                            </a>
                        </div>

                        <Button
                            variant="warning"
                            type="submit"
                            className="w-100 py-3 fw-bold mb-3 text-white d-flex align-items-center justify-content-center"
                            style={{ borderRadius: '10px', fontSize: '1.1rem' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    {t('auth.logging_in')}
                                </>
                            ) : t('auth.login_btn')}
                        </Button>
                    </Form>

                    <div className="text-center mt-3">
                        <small className="text-muted">{t('auth.no_account')} <Link to="/register" className="fw-bold text-warning">{t('auth.register_link')}</Link></small>
                    </div>
                </Card.Body>
            </Card>

            {/* Forgot Password Modal */}
            <Modal show={showForgot} onHide={() => setShowForgot(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Mot de passe oublié ?</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <p className="text-muted small mb-4">Entrez votre adresse email. Si celle-ci existe, nous vous enverrons un nouveau mot de passe temporaire.</p>
                    {forgotMessage && <Alert variant="info" className="py-2 small">{forgotMessage}</Alert>}
                    <Form onSubmit={handleForgotPassword}>
                        <Form.Group className="mb-3">
                            <Form.Control 
                                type="email" 
                                placeholder="votre@email.com" 
                                value={forgotEmail} 
                                onChange={(e) => setForgotEmail(e.target.value)} 
                                required 
                                disabled={forgotLoading}
                            />
                        </Form.Group>
                        <Button variant="dark" type="submit" className="w-100 fw-bold" disabled={forgotLoading}>
                            {forgotLoading ? 'Envoi en cours...' : 'Envoyer'}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default Login;
