import { Container, Card, Button, Row, Col, Modal, Form, Alert } from 'react-bootstrap';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import ProfileLayout from '../components/ProfileLayout';
import { useLanguage } from '../context/LanguageContext';

const Addresses = () => {
    const { user } = useAuth();
    const { showToast, confirm } = useToast();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [showModal, setShowModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    // Load addresses from localStorage
    const [addresses, setAddresses] = useState(() => {
        if (!user) return [];
        const saved = localStorage.getItem(`addresses_${user.email}`);
        return saved ? JSON.parse(saved) : [];
    });

    const [formData, setFormData] = useState({
        title: '',
        fullName: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'pays'
    });

    // Redirect if not logged in
    if (!user) {
        return (
            <ProfileLayout>
                <div className="mb-4">
                    <h3 className="fw-bold">{t('addresses.title')}</h3>
                    <p className="text-muted">{t('addresses.subtitle')}</p>
                </div>
                <Container className="py-5 text-center">
                    <Alert variant="info">
                        <Alert.Heading>{t('favorites_page.login_required')}</Alert.Heading>
                        <p>{t('addresses.subtitle')}</p>
                        <Button variant="primary" onClick={() => navigate('/login')}>
                            {t('auth.login_btn')}
                        </Button>
                    </Alert>
                </Container>
            </ProfileLayout>
        );
    }

    const saveAddresses = (newAddresses) => {
        setAddresses(newAddresses);
        localStorage.setItem(`addresses_${user.email}`, JSON.stringify(newAddresses));
    };

    const handleOpenModal = (address = null) => {
        if (address) {
            setEditingAddress(address);
            setFormData(address);
        } else {
            setEditingAddress(null);
            setFormData({
                title: '',
                fullName: '',
                phone: '',
                address: '',
                city: '',
                postalCode: '',
                country: 'pays'
            });
        }
        setShowModal(true);
    };

    const handleSaveAddress = () => {
        if (!formData.title || !formData.fullName || !formData.address || !formData.city) {
            showToast(t('addresses.fill_required'), 'warning');
            return;
        }

        let newAddresses;
        if (editingAddress) {
            // Update existing address
            newAddresses = addresses.map(addr =>
                addr.id === editingAddress.id ? { ...formData, id: editingAddress.id } : addr
            );
        } else {
            // Add new address
            const newAddress = { ...formData, id: Date.now() };
            newAddresses = [...addresses, newAddress];
        }

        saveAddresses(newAddresses);
        setShowModal(false);
    };

    const handleDeleteAddress = async (id) => {
        const ok = await confirm({
            title: t('addresses.delete_confirm_title'),
            message: t('addresses.delete_confirm_msg'),
            variant: 'danger',
            confirmText: t('common.delete')
        });

        if (ok) {
            const newAddresses = addresses.filter(addr => addr.id !== id);
            saveAddresses(newAddresses);
            showToast(t('addresses.delete_success'), 'success');
        }
    };

    return (
        <ProfileLayout>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold">
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    {t('addresses.title')}
                </h2>
                <Button variant="warning" className="text-white fw-bold" onClick={() => handleOpenModal()}>
                    <i className="bi bi-plus-lg me-2"></i>
                    {t('addresses.add_new')}
                </Button>
            </div>

            {addresses.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-house" style={{ fontSize: '5rem', color: '#ddd' }}></i>
                    <h3 className="mt-4 text-muted">{t('addresses.no_addresses')}</h3>
                    <p className="text-muted mb-4">{t('addresses.add_first')}</p>
                    <Button variant="warning" className="text-white fw-bold" onClick={() => handleOpenModal()}>
                        {t('addresses.add_btn')}
                    </Button>
                </div>
            ) : (
                <Row className="g-4">
                    {addresses.map(address => (
                        <Col key={address.id} md={6} lg={4}>
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h5 className="fw-bold text-warning">{address.title}</h5>
                                        <div>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-1 text-primary"
                                                onClick={() => handleOpenModal(address)}
                                            >
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-1 text-danger"
                                                onClick={() => handleDeleteAddress(address.id)}
                                            >
                                                <i className="bi bi-trash-fill"></i>
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="mb-1"><strong>{address.fullName}</strong></p>
                                    <p className="mb-1 text-muted small">{address.phone}</p>
                                    <p className="mb-1 text-muted small">{address.address}</p>
                                    <p className="mb-0 text-muted small">
                                        {address.city}, {address.postalCode}
                                    </p>
                                    <p className="mb-0 text-muted small">{address.country}</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Add/Edit Address Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingAddress ? t('addresses.edit_title') : t('addresses.new_title')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>{t('addresses.address_title_label')} *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder={t('addresses.placeholder_title')}
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('addresses.full_name_label')} *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('addresses.phone_label')}</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('addresses.address_label')} *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </Form.Group>
# (re-translating specific "Connexion requise" message if I find a better key)

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('addresses.city_label')} *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('addresses.postal_code_label')}</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.postalCode}
                                        onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('addresses.country_label')}</Form.Label>
                            <Form.Select
                                value={formData.country}
                                onChange={e => setFormData({ ...formData, country: e.target.value })}
                            >
                                <option value="Afghanistan">Afghanistan</option>
                                <option value="Afrique du Sud">Afrique du Sud</option>
                                <option value="Albanie">Albanie</option>
                                <option value="Algérie">Algérie</option>
                                <option value="Allemagne">Allemagne</option>
                                <option value="Andorre">Andorre</option>
                                <option value="Angola">Angola</option>
                                <option value="Antigua-et-Barbuda">Antigua-et-Barbuda</option>
                                <option value="Arabie Saoudite">Arabie Saoudite</option>
                                <option value="Argentine">Argentine</option>
                                <option value="Arménie">Arménie</option>
                                <option value="Australie">Australie</option>
                                <option value="Autriche">Autriche</option>
                                <option value="Azerbaïdjan">Azerbaïdjan</option>
                                <option value="Bahamas">Bahamas</option>
                                <option value="Bahreïn">Bahreïn</option>
                                <option value="Bangladesh">Bangladesh</option>
                                <option value="Barbade">Barbade</option>
                                <option value="Belgique">Belgique</option>
                                <option value="Belize">Belize</option>
                                <option value="Bénin">Bénin</option>
                                <option value="Bhoutan">Bhoutan</option>
                                <option value="Biélorussie">Biélorussie</option>
                                <option value="Birmanie">Birmanie</option>
                                <option value="Bolivie">Bolivie</option>
                                <option value="Bosnie-Herzégovine">Bosnie-Herzégovine</option>
                                <option value="Botswana">Botswana</option>
                                <option value="Brésil">Brésil</option>
                                <option value="Brunei">Brunei</option>
                                <option value="Bulgarie">Bulgarie</option>
                                <option value="Burkina Faso">Burkina Faso</option>
                                <option value="Burundi">Burundi</option>
                                <option value="Cambodge">Cambodge</option>
                                <option value="Cameroun">Cameroun</option>
                                <option value="Canada">Canada</option>
                                <option value="Cap-Vert">Cap-Vert</option>
                                <option value="Chili">Chili</option>
                                <option value="Chine">Chine</option>
                                <option value="Chypre">Chypre</option>
                                <option value="Colombie">Colombie</option>
                                <option value="Comores">Comores</option>
                                <option value="Congo">Congo</option>
                                <option value="Corée du Nord">Corée du Nord</option>
                                <option value="Corée du Sud">Corée du Sud</option>
                                <option value="Costa Rica">Costa Rica</option>
                                <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                                <option value="Croatie">Croatie</option>
                                <option value="Cuba">Cuba</option>
                                <option value="Danemark">Danemark</option>
                                <option value="Djibouti">Djibouti</option>
                                <option value="Dominique">Dominique</option>
                                <option value="Égypte">Égypte</option>
                                <option value="Émirats Arabes Unis">Émirats Arabes Unis</option>
                                <option value="Équateur">Équateur</option>
                                <option value="Érythrée">Érythrée</option>
                                <option value="Espagne">Espagne</option>
                                <option value="Estonie">Estonie</option>
                                <option value="Eswatini">Eswatini</option>
                                <option value="États-Unis">États-Unis</option>
                                <option value="Éthiopie">Éthiopie</option>
                                <option value="Fidji">Fidji</option>
                                <option value="Finlande">Finlande</option>
                                <option value="France">France</option>
                                <option value="Gabon">Gabon</option>
                                <option value="Gambie">Gambie</option>
                                <option value="Géorgie">Géorgie</option>
                                <option value="Ghana">Ghana</option>
                                <option value="Grèce">Grèce</option>
                                <option value="Grenade">Grenade</option>
                                <option value="Guatemala">Guatemala</option>
                                <option value="Guinée">Guinée</option>
                                <option value="Guinée-Bissau">Guinée-Bissau</option>
                                <option value="Guinée Équatoriale">Guinée Équatoriale</option>
                                <option value="Guyana">Guyana</option>
                                <option value="Haïti">Haïti</option>
                                <option value="Honduras">Honduras</option>
                                <option value="Hongrie">Hongrie</option>
                                <option value="Inde">Inde</option>
                                <option value="Indonésie">Indonésie</option>
                                <option value="Irak">Irak</option>
                                <option value="Iran">Iran</option>
                                <option value="Irlande">Irlande</option>
                                <option value="Islande">Islande</option>
                                <option value="Israël">Israël</option>
                                <option value="Italie">Italie</option>
                                <option value="Jamaïque">Jamaïque</option>
                                <option value="Japon">Japon</option>
                                <option value="Jordanie">Jordanie</option>
                                <option value="Kazakhstan">Kazakhstan</option>
                                <option value="Kenya">Kenya</option>
                                <option value="Kirghizistan">Kirghizistan</option>
                                <option value="Kiribati">Kiribati</option>
                                <option value="Koweït">Koweït</option>
                                <option value="Laos">Laos</option>
                                <option value="Lesotho">Lesotho</option>
                                <option value="Lettonie">Lettonie</option>
                                <option value="Liban">Liban</option>
                                <option value="Liberia">Liberia</option>
                                <option value="Libye">Libye</option>
                                <option value="Liechtenstein">Liechtenstein</option>
                                <option value="Lituanie">Lituanie</option>
                                <option value="Luxembourg">Luxembourg</option>
                                <option value="Macédoine du Nord">Macédoine du Nord</option>
                                <option value="Madagascar">Madagascar</option>
                                <option value="Malaisie">Malaisie</option>
                                <option value="Malawi">Malawi</option>
                                <option value="Maldives">Maldives</option>
                                <option value="Mali">Mali</option>
                                <option value="Malte">Malte</option>
                                <option value="Maroc">Maroc</option>
                                <option value="Marshall">Marshall</option>
                                <option value="Maurice">Maurice</option>
                                <option value="Mauritanie">Mauritanie</option>
                                <option value="Mexique">Mexique</option>
                                <option value="Micronésie">Micronésie</option>
                                <option value="Moldavie">Moldavie</option>
                                <option value="Monaco">Monaco</option>
                                <option value="Mongolie">Mongolie</option>
                                <option value="Monténégro">Monténégro</option>
                                <option value="Mozambique">Mozambique</option>
                                <option value="Namibie">Namibie</option>
                                <option value="Nauru">Nauru</option>
                                <option value="Népal">Népal</option>
                                <option value="Nicaragua">Nicaragua</option>
                                <option value="Niger">Niger</option>
                                <option value="Nigeria">Nigeria</option>
                                <option value="Norvège">Norvège</option>
                                <option value="Nouvelle-Zélande">Nouvelle-Zélande</option>
                                <option value="Oman">Oman</option>
                                <option value="Ouganda">Ouganda</option>
                                <option value="Ouzbékistan">Ouzbékistan</option>
                                <option value="Pakistan">Pakistan</option>
                                <option value="Palaos">Palaos</option>
                                <option value="Palestine">Palestine</option>
                                <option value="Panama">Panama</option>
                                <option value="Papouasie-Nouvelle-Guinée">Papouasie-Nouvelle-Guinée</option>
                                <option value="Paraguay">Paraguay</option>
                                <option value="Pays-Bas">Pays-Bas</option>
                                <option value="Pérou">Pérou</option>
                                <option value="Philippines">Philippines</option>
                                <option value="Pologne">Pologne</option>
                                <option value="Portugal">Portugal</option>
                                <option value="Qatar">Qatar</option>
                                <option value="République Centrafricaine">République Centrafricaine</option>
                                <option value="République Démocratique du Congo">République Démocratique du Congo</option>
                                <option value="République Dominicaine">République Dominicaine</option>
                                <option value="République Tchèque">République Tchèque</option>
                                <option value="Roumanie">Roumanie</option>
                                <option value="Royaume-Uni">Royaume-Uni</option>
                                <option value="Russie">Russie</option>
                                <option value="Rwanda">Rwanda</option>
                                <option value="Saint-Christophe-et-Niévès">Saint-Christophe-et-Niévès</option>
                                <option value="Saint-Marin">Saint-Marin</option>
                                <option value="Saint-Vincent-et-les-Grenadines">Saint-Vincent-et-les-Grenadines</option>
                                <option value="Sainte-Lucie">Sainte-Lucie</option>
                                <option value="Salomon">Salomon</option>
                                <option value="Salvador">Salvador</option>
                                <option value="Samoa">Samoa</option>
                                <option value="São Tomé-et-Principe">São Tomé-et-Principe</option>
                                <option value="Sénégal">Sénégal</option>
                                <option value="Serbie">Serbie</option>
                                <option value="Seychelles">Seychelles</option>
                                <option value="Sierra Leone">Sierra Leone</option>
                                <option value="Singapour">Singapour</option>
                                <option value="Slovaquie">Slovaquie</option>
                                <option value="Slovénie">Slovénie</option>
                                <option value="Somalie">Somalie</option>
                                <option value="Soudan">Soudan</option>
                                <option value="Soudan du Sud">Soudan du Sud</option>
                                <option value="Sri Lanka">Sri Lanka</option>
                                <option value="Suède">Suède</option>
                                <option value="Suisse">Suisse</option>
                                <option value="Suriname">Suriname</option>
                                <option value="Syrie">Syrie</option>
                                <option value="Tadjikistan">Tadjikistan</option>
                                <option value="Tanzanie">Tanzanie</option>
                                <option value="Tchad">Tchad</option>
                                <option value="Thaïlande">Thaïlande</option>
                                <option value="Timor Oriental">Timor Oriental</option>
                                <option value="Togo">Togo</option>
                                <option value="Tonga">Tonga</option>
                                <option value="Trinité-et-Tobago">Trinité-et-Tobago</option>
                                <option value="Tunisie">Tunisie</option>
                                <option value="Turkménistan">Turkménistan</option>
                                <option value="Turquie">Turquie</option>
                                <option value="Tuvalu">Tuvalu</option>
                                <option value="Ukraine">Ukraine</option>
                                <option value="Uruguay">Uruguay</option>
                                <option value="Vanuatu">Vanuatu</option>
                                <option value="Vatican">Vatican</option>
                                <option value="Venezuela">Venezuela</option>
                                <option value="Viêt Nam">Viêt Nam</option>
                                <option value="Yémen">Yémen</option>
                                <option value="Zambie">Zambie</option>
                                <option value="Zimbabwe">Zimbabwe</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="warning" className="text-white fw-bold" onClick={handleSaveAddress}>
                        {t('addresses.save_btn')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </ProfileLayout>
    );
};

export default Addresses;
