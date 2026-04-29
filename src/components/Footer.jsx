import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
    const { t } = useLanguage();
    return (
        <footer className="footer-premium pt-3 pb-3 pb-lg-2 mt-auto" style={{
            background: 'linear-gradient(180deg, #1c1c1c 0%, #0a0a0a 100%)',
            borderTop: '4px solid #ff6000',
            color: '#ffffff'
        }}>
            <Container>
                <Row className="gy-3">
                    {/* Brand Section */}
                    <Col lg={5} md={12} className="mb-4 mb-lg-0 text-center text-lg-start">
                        <div className="mb-3">
                            <h4 className="fw-bold mb-1" style={{ letterSpacing: '1px', color: '#ff6000' }}>TRYMYDAY</h4>
                            <p className="small opacity-75 mx-auto mx-lg-0" style={{ maxWidth: '350px', lineHeight: '1.6', color: '#e0e0e0' }}>
                                {t('footer.description')}
                            </p>
                        </div>
                        <div className="d-flex gap-4 mb-4 justify-content-center justify-content-lg-start">
                            <a href="#" className="text-white hover-text-orange fs-5 transition-all"><i className="bi bi-facebook"></i></a>
                            <a href="#" className="text-white hover-text-orange fs-5 transition-all"><i className="bi bi-instagram"></i></a>
                            <a href="#" className="text-white hover-text-orange fs-5 transition-all"><i className="bi bi-whatsapp"></i></a>
                        </div>
                    </Col>


                    {/* Support */}
                    <Col lg={3} md={6} sm={6} className="text-center text-lg-start">
                        <h6 className="fw-bold mb-3 text-uppercase small" style={{ letterSpacing: '1px', color: '#ff6000' }}>{t('footer.assistance')}</h6>
                        <ul className="list-unstyled small d-flex flex-column gap-2 align-items-center align-items-lg-start">
                            <li><Link to="/help" className="text-white-50 text-decoration-none hover-text-orange transition-all">{t('footer.help_center')}</Link></li>
                            <li><Link to="/profile/messages" className="text-white-50 text-decoration-none hover-text-orange transition-all">{t('footer.contact_us')}</Link></li>
                            <li><Link to="/help#faq" className="text-white-50 text-decoration-none hover-text-orange transition-all">{t('footer.faq')}</Link></li>
                            <li><Link to="/help#delivery" className="text-white-50 text-decoration-none hover-text-orange transition-all">{t('footer.delivery')}</Link></li>
                        </ul>
                    </Col>

                    {/* Contact Info */}
                    <Col lg={4} md={6} sm={12} className="text-center text-lg-start mt-4 mt-lg-0">
                        <h6 className="fw-bold mb-3 text-uppercase small" style={{ letterSpacing: '1px', color: '#ff6000' }}>{t('footer.contact')}</h6>
                        <div className="small d-flex flex-column gap-3 align-items-center align-items-lg-start">
                            <div className="d-flex align-items-start gap-3 text-white-50 justify-content-center justify-content-lg-start">
                                <i className="bi bi-geo-alt-fill fs-5" style={{ color: '#ff6000' }}></i>
                                <span className="text-center text-lg-start">Ndjamena, Tchad</span>
                            </div>
                            <div className="d-flex align-items-center gap-3 text-white-50 justify-content-center justify-content-lg-start">
                                <i className="bi bi-telephone-fill fs-5" style={{ color: '#ff6000' }}></i>
                                <span>+90 546 194 16 73</span>
                            </div>
                            <div className="d-flex align-items-center gap-3 text-white-50 justify-content-center justify-content-lg-start">
                                <i className="bi bi-envelope-fill fs-5" style={{ color: '#ff6000' }}></i>
                                <span>trymyday235@gmail.com</span>
                            </div>
                        </div>
                    </Col>
                </Row>

                <hr className="my-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)', height: '1px', border: 'none' }} />

                <Row className="align-items-center pb-2 text-center text-md-start">
                    <Col md={6} className="mb-3 mb-md-0">
                        <p className="mb-0 small text-white-50">&copy; 2026 <span className="fw-bold" style={{ color: '#ff6000' }}>TRYMYDAY</span>. {t('footer.rights')}</p>
                    </Col>
                    <Col md={6} className="text-center text-md-end">
                        <div className="d-flex gap-4 justify-content-center justify-content-md-end text-white-50 fs-4 opacity-75">
                            <i className="bi bi-credit-card-2-front hover-text-orange transition-all" title={t('footer.secure_payment')}></i>
                            <i className="bi bi-wallet2 hover-text-orange transition-all" title={t('footer.wallet')}></i>
                            <i className="bi bi-shield-lock hover-text-orange transition-all" title={t('footer.privacy_guaranteed')}></i>
                        </div>
                    </Col>
                </Row>
            </Container>

            <style>{`
                .hover-text-orange:hover {
                    color: #ff6000 !important;
                }
                .transition-all {
                    transition: all 0.3s ease;
                }
            `}</style>
        </footer>
    );
};

export default Footer;
