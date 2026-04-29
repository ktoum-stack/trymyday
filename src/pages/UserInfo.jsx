import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileLayout from '../components/ProfileLayout';
import { useLanguage } from '../context/LanguageContext';

const UserInfo = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (formData.newPassword) {
            if (formData.newPassword !== formData.confirmPassword) {
                setError(t('user_info.password_mismatch'));
                return;
            }
            if (formData.newPassword.length < 6) {
                setError(t('user_info.password_short'));
                return;
            }
        }

        const updatedUser = {
            ...user,
            name: formData.name,
            email: formData.email,
            phone: formData.phone
        };

        if (updateUser) {
            updateUser(updatedUser);
        }

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);

        setFormData({
            ...formData,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    return (
        <ProfileLayout>
            <div className="mb-4">
                <h3 className="fw-bold">{t('user_info.title')}</h3>
                <p className="text-muted">{t('user_info.subtitle')}</p>
            </div>

            {showSuccess && (
                <Alert variant="success" dismissible onClose={() => setShowSuccess(false)}>
                    {t('user_info.success_msg')}
                </Alert>
            )}

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                    <h5 className="fw-bold mb-4">{t('user_info.personal_info')}</h5>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('user_info.full_name')}</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('user_info.email')}</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-4">
                            <Form.Label>{t('user_info.phone')}</Form.Label>
                            <Form.Control
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+90 XXX XXX XX XX"
                            />
                        </Form.Group>

                        <hr className="my-4" />

                        <h5 className="fw-bold mb-4">{t('user_info.change_password')}</h5>
                        <p className="text-muted small mb-3">
                            {t('user_info.change_password_hint')}
                        </p>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('user_info.current_password')}</Form.Label>
                            <Form.Control
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                placeholder={t('user_info.current_password_placeholder')}
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('user_info.new_password')}</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        placeholder={t('user_info.new_password_placeholder')}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('user_info.confirm_new_password')}</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder={t('user_info.confirm_password_placeholder')}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-between mt-4">
                            <Button variant="outline-secondary" onClick={() => navigate('/profile')}>
                                {t('user_info.back')}
                            </Button>
                            <Button variant="warning" type="submit" className="text-white fw-bold px-4">
                                {t('user_info.save_changes')}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    <h5 className="fw-bold mb-3">{t('user_info.account_details')}</h5>
                    <div className="bg-light p-3 rounded">
                        <Row>
                            <Col md={6} className="mb-2">
                                <small className="text-muted d-block">{t('user_info.user_id')}</small>
                                <strong className="small">{user?.id || 'N/A'}</strong>
                            </Col>
                            <Col md={6} className="mb-2">
                                <small className="text-muted d-block">{t('user_info.join_date')}</small>
                                <strong className="small">
                                    {user?.createdAt || new Date().toLocaleDateString('fr-FR')}
                                </strong>
                            </Col>
                            <Col md={6}>
                                <small className="text-muted d-block">{t('user_info.account_type')}</small>
                                <strong className="small">{user?.role === 'admin' ? t('user_info.role_admin') : t('user_info.role_customer')}</strong>
                            </Col>
                            <Col md={6}>
                                <small className="text-muted d-block">{t('user_info.status')}</small>
                                <strong className="small text-success">{t('user_info.status_active')}</strong>
                            </Col>
                        </Row>
                    </div>
                </Card.Body>
            </Card>
        </ProfileLayout>
    );
};

export default UserInfo;
