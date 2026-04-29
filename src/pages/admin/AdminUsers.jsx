import { useState } from 'react';
import { Table, Button, Modal, Form, Badge, Row, Col, InputGroup } from 'react-bootstrap';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';

// Fonction pour générer un ID unique (identique à AuthContext)
const generateUserId = () => {
    const chars = '0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
};

const AdminUsers = () => {
    const { users, setUsers, adminUpdateUser, adminDeleteUser, adminAddUser } = useData();
    const { user } = useAuth();
    const { showToast, confirm } = useToast();
    const navigate = useNavigate();
    const { t } = useLanguage();

    if (user?.role === 'expediteur' || user?.role === 'manager') {
        navigate('/admin');
        return null;
    }
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'client'
    });

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    // Open modal for creating new user
    const handleCreate = () => {
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'client'
        });
        setShowModal(true);
    };

    // Open modal for editing user
    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            password: '',
            role: user.role || 'client'
        });
        setShowModal(true);
    };

    // Save user (create or update)
    const handleSave = async () => {
        if (!formData.name || !formData.email) {
            showToast('Veuillez remplir tous les champs obligatoires', 'warning');
            return;
        }

        if (editingUser) {
            // Update existing user
            const success = await adminUpdateUser(editingUser.id || editingUser.email, {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                ...(formData.password && { password: formData.password })
            });

            if (success) {
                showToast('Utilisateur modifié avec succès !', 'success');
            } else {
                showToast('Erreur lors de la modification.', 'danger');
            }
        } else {
            // Create new user
            if (!formData.password) {
                showToast('Le mot de passe est obligatoire.', 'warning');
                return;
            }

            // Check if email already exists (case-insensitive)
            if (users.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
                showToast('Cet email est déjà utilisé', 'warning');
                return;
            }

            const newUser = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                joined: new Date().toISOString().split('T')[0],
                balance: 0,
                avatar: '👤'
            };

            const success = await adminAddUser(newUser);
            if (success) {
                showToast('Utilisateur créé avec succès !', 'success');
            } else {
                showToast('Erreur lors de la création.', 'danger');
            }
        }

        setShowModal(false);
    };

    // Delete user
    const handleDelete = async (user) => {
        if (user.email.toLowerCase() === 'trymyday235@gmail.com') {
            showToast('Impossible de supprimer le compte administrateur principal !', 'danger');
            return;
        }

        const ok = await confirm({
            title: 'Supprimer l\'utilisateur',
            message: `Êtes-vous sûr de vouloir supprimer ${user.name || user.email} ?`,
            variant: 'danger',
            confirmText: 'Supprimer'
        });

        if (ok) {
            const success = await adminDeleteUser(user.email);
            if (success) {
                showToast('Utilisateur supprimé avec succès !', 'success');
            } else {
                showToast('Erreur lors de la suppression.', 'danger');
            }
        }
    };

    return (
        <div>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <h4 className="fw-bold mb-0">{t('admin_users.title')}</h4>
                <Button variant="primary" onClick={handleCreate} className="fw-bold px-4 py-2 rounded-pill shadow-sm">
                    <i className="bi bi-person-plus-fill me-2"></i>
                    Nouveau Client
                </Button>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-3 rounded-4 shadow-sm border mb-4">
                <Row className="g-2 g-md-3">
                    <Col xs={12} md={7}>
                        <InputGroup className="shadow-none border rounded overflow-hidden">
                            <InputGroup.Text className="bg-white border-0 pe-0">
                                <i className="bi bi-search text-muted opacity-50"></i>
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Nom ou email..."
                                className="border-0 shadow-none py-2"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </Col>
                    <Col xs={12} md={5}>
                        <Form.Select className="shadow-none border rounded py-2" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value="all">Tous les rôles</option>
                            <option value="client">{t('admin_users.user')}</option>
                            <option value="admin">{t('admin_users.admin')}</option>
                            <option value="manager">{t('admin_users.manager')}</option>
                            <option value="expediteur">{t('admin_users.shipper')}</option>
                        </Form.Select>
                    </Col>
                </Row>
            </div>

            {/* Users Table */}
            {filteredUsers.length === 0 ? (
                <div className="text-center text-muted py-5 bg-white border rounded-4 shadow-sm">
                    <i className="bi bi-people opacity-20" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-3 fw-medium">Aucun utilisateur trouvé</p>
                </div>
            ) : (
                <div className="bg-white border rounded-4 shadow-sm overflow-hidden tech-user-table-container">
                    <Table hover responsive className="mb-0 align-middle tech-user-table">
                        <thead className="bg-light d-none d-md-table-header-group">
                            <tr>
                                <th className="ps-4 py-3">ID</th>
                                <th className="py-3">Nom</th>
                                <th className="py-3">Email</th>
                                <th className="py-3">{t('admin_users.role')}</th>
                                <th className="py-3">{t('admin_users.join_date')}</th>
                                <th className="text-end pe-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user, index) => (
                                <tr key={user.email} className="tech-user-row">
                                    <td className="ps-3 ps-md-4 py-3 user-id-cell">
                                        <div className="text-muted small">#{user.id || index + 1}</div>
                                    </td>
                                    <td className="py-3 user-name-cell">
                                        <div className="fw-bold text-dark">{user.name}</div>
                                    </td>
                                    <td className="py-3 user-email-cell">
                                        <div className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>{user.email}</div>
                                    </td>
                                    <td className="py-3 user-role-cell">
                                        <Badge bg={user.role === 'admin' ? 'danger' : user.role === 'manager' ? 'warning' : 'info'} className="px-2 py-1 rounded-pill" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                            {user.role}
                                        </Badge>
                                    </td>
                                    <td className="d-none d-lg-table-cell py-3">
                                        <div className="text-muted small">
                                            {user.joined ? (
                                                new Date(user.joined).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric'
                                                })
                                            ) : 'Date inconnue'}
                                        </div>
                                    </td>
                                    <td className="text-end pe-3 pe-md-4 py-3 user-actions-cell">
                                        <div className="d-flex justify-content-end gap-1">
                                            <Button
                                                variant="outline-primary"
                                                className="border-0 p-2 rounded-circle shadow-none"
                                                onClick={() => handleEdit(user)}
                                                title="Modifier"
                                            >
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                className="border-0 p-2 rounded-circle shadow-none"
                                                onClick={() => handleDelete(user)}
                                                title="Supprimer"
                                            >
                                                <i className="bi bi-trash-fill"></i>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}

            <style>{`
                .tech-user-row { transition: all 0.2s ease; }
                .tech-user-row:hover { background-color: #fcfcfc !important; }
                
                @media (max-width: 767.98px) {
                    .tech-user-table-container { border: none !important; box-shadow: none !important; background: transparent !important; }
                    .tech-user-table thead { display: none; }
                    .tech-user-table tbody tr { 
                        display: flex !important; 
                        flex-wrap: wrap; 
                        background: #fff; 
                        margin-bottom: 12px; 
                        border-radius: 12px; 
                        padding: 15px; 
                        border: 1px solid #eee; 
                        box-shadow: 0 4px 12px rgba(0,0,0,0.03); 
                        position: relative;
                        align-items: center;
                    }
                    .tech-user-table td { border: none !important; padding: 0 !important; }
                    .user-id-cell { width: 100%; margin-bottom: 4px; }
                    .user-name-cell { width: auto; flex-grow: 1; }
                    .user-role-cell { width: auto; margin-right: 15px; }
                    .user-email-cell { width: 100%; margin-top: 8px; border-top: 1px dashed #eee; padding-top: 8px !important; }
                    .user-actions-cell { position: absolute; top: 15px; right: 10px; width: auto !important; }
                }
            `}</style>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingUser ? 'Modifier l\'utilisateur' : 'Nouveau utilisateur'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Nom complet *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Jean Dupont"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Email *</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="jean@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={!!editingUser}
                            />
                            {editingUser && (
                                <Form.Text className="text-muted">
                                    L'email ne peut pas être modifié
                                </Form.Text>
                            )}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Mot de passe {!editingUser && '*'}
                            </Form.Label>
                            <Form.Control
                                type="password"
                                placeholder={editingUser ? 'Laisser vide pour ne pas changer' : 'Mot de passe'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('admin_users.role')} *</Form.Label>
                            <Form.Select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="client">{t('admin_users.user')}</option>
                                <option value="manager">{t('admin_users.manager')}</option>
                                <option value="expediteur">{t('admin_users.shipper')}</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Annuler
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        {editingUser ? 'Modifier' : 'Créer'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AdminUsers;
