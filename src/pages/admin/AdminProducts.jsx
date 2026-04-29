import { useState } from 'react';
import { Table, Button, Form, Modal, Badge, Row, Col, InputGroup, Card } from 'react-bootstrap';
import { useData, CATEGORIES } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import Barcode from 'react-barcode';
import BarcodeScanner from '../../components/BarcodeScanner';

const AdminProducts = () => {
    const { t } = useLanguage();
    const data = useData();
    if (!data) return <div className="p-4">Chargement des données...</div>;
    const { products, addProduct, deleteProduct, updateProduct } = data;
    const { user } = useAuth();
    const { showToast, confirm } = useToast();
    const isManager = user?.role === 'manager';
    const navigate = useNavigate();

    if (user?.role === 'expediteur') {
        navigate('/admin');
        return null;
    }

    const emptyProduct = {
        name: '', brand: '', collection: '', tags: '', sku: '',
        price: '', stock: '', category: 'Femme', subcategory: '',
        description: '', images: [], attributes: [], availableSizes: [],
        barcode: '', flashSale: null,
        // Page flags
        isNew: false, isGift: false, isCollection: false, isFavorite: false, isBestSeller: false
    };

    const [showModal, setShowModal] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(emptyProduct);
    const [isEditing, setIsEditing] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [showSearchScanner, setShowSearchScanner] = useState(false);
    const [imageSource, setImageSource] = useState('upload');

    // ─── Flash Sale State ───────────────────────────────────────────────────────
    const [flashEnabled, setFlashEnabled] = useState(false);
    const [flashDiscount, setFlashDiscount] = useState('');
    const [flashStart, setFlashStart] = useState('');
    const [flashEnd, setFlashEnd] = useState('');

    // ─── Color variant state ────────────────────────────────────────────────────
    // Each variant: { name, hex, price, images[] }
    const [colorVariants, setColorVariants] = useState([]);
    const [editingVariantIdx, setEditingVariantIdx] = useState(null); // null = adding new
    const [variantForm, setVariantForm] = useState({ name: '', hex: '#000000', price: '', images: [] });
    const [variantImgSource, setVariantImgSource] = useState('upload');
    const [variantImgUrl, setVariantImgUrl] = useState('');

    // Generate EAN-13
    const generateEAN13 = () => {
        const base = Date.now().toString().slice(-8) + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        let sum = 0;
        for (let i = 0; i < 12; i++) sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
        const checkDigit = (10 - (sum % 10)) % 10;
        return base + checkDigit;
    };

    // Attributes
    const [newAttribute, setNewAttribute] = useState({ label: '', value: '' });

    const addAttribute = () => {
        if (newAttribute.label && newAttribute.value) {
            setCurrentProduct({ ...currentProduct, attributes: [...(currentProduct.attributes || []), newAttribute] });
            setNewAttribute({ label: '', value: '' });
        }
    };
    const removeAttribute = (index) => {
        setCurrentProduct({ ...currentProduct, attributes: currentProduct.attributes.filter((_, i) => i !== index) });
    };

    const ATTRIBUTE_TEMPLATES = {
        'Clothing': ['Matière', 'Coupe', 'Doublure', 'Col', 'Motif', 'Fermeture', 'Longueur'],
        'Tech': ['Processeur', 'RAM', 'Stockage', 'Écran', 'Batterie', 'Système'],
        'Beauty': ['Type de peau', 'Volume', 'Ingrédients', 'Usage'],
        'Home': ['Dimensions', 'Matière', 'Poids', 'Assemblage'],
        'Shoes': ['Matière Extér.', 'Semelle', 'Fermeture', 'Largeur'],
        'Bags': ['Matière', 'Dimensions', 'Type de fermeture', 'Nb compartiments']
    };
    const getTemplateKey = (cat) => {
        if (['Femme', 'Homme', 'Enfant'].includes(cat)) return 'Clothing';
        if (['Électronique'].includes(cat)) return 'Tech';
        if (['Cosmétique'].includes(cat)) return 'Beauty';
        if (['Maison & Meuble'].includes(cat)) return 'Home';
        if (['Chaussures'].includes(cat)) return 'Shoes';
        if (['Sacs'].includes(cat)) return 'Bags';
        return null;
    };
    const handleTemplateFieldChange = (label, value) => {
        const existing = currentProduct.attributes || [];
        const index = existing.findIndex(a => a.label === label);
        let updated = [...existing];
        if (index > -1) {
            if (value === '') updated.splice(index, 1);
            else updated[index] = { ...updated[index], value };
        } else if (value !== '') {
            updated.push({ label, value });
        }
        setCurrentProduct({ ...currentProduct, attributes: updated });
    };
    const getFieldValue = (label) => {
        const attr = (currentProduct.attributes || []).find(a => a.label === label);
        return attr ? attr.value : '';
    };

    const SIZE_PRESETS = {
        'Clothing': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        'Shoes': ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
    };
    const toggleSize = (size) => {
        const current = currentProduct.availableSizes || [];
        setCurrentProduct({ ...currentProduct, availableSizes: current.includes(size) ? current.filter(s => s !== size) : [...current, size] });
    };

    // ─── Filters ─────────────────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showLimit, setShowLimit] = useState(10);

    // ─── Main image helpers ───────────────────────────────────────────────────
    const addImage = () => {
        if (newImageUrl.trim()) {
            setCurrentProduct({ ...currentProduct, images: [...(currentProduct.images || []), newImageUrl] });
            setNewImageUrl('');
        }
    };
    const handleFileUpload = (e) => {
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setCurrentProduct(prev => ({ ...prev, images: [...(prev.images || []), reader.result] }));
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };
    const removeImage = (index) => {
        setCurrentProduct({ ...currentProduct, images: currentProduct.images.filter((_, i) => i !== index) });
    };

    // ─── Variant image helpers ────────────────────────────────────────────────
    const addVariantImage = () => {
        if (variantImgUrl.trim()) {
            setVariantForm(prev => ({ ...prev, images: [...(prev.images || []), variantImgUrl] }));
            setVariantImgUrl('');
        }
    };
    const handleVariantFileUpload = (e) => {
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setVariantForm(prev => ({ ...prev, images: [...(prev.images || []), reader.result] }));
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };
    const removeVariantImage = (idx) => {
        setVariantForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
    };

    // ─── Variant CRUD ─────────────────────────────────────────────────────────
    const resetVariantForm = () => {
        setVariantForm({ name: '', hex: '#000000', price: '', images: [] });
        setEditingVariantIdx(null);
        setVariantImgUrl('');
    };
    const saveVariant = () => {
        if (!variantForm.name) { showToast('Nom de couleur requis', 'warning'); return; }
        const v = { ...variantForm, price: variantForm.price ? Number(variantForm.price) : undefined };
        if (editingVariantIdx !== null) {
            const updated = [...colorVariants];
            updated[editingVariantIdx] = v;
            setColorVariants(updated);
        } else {
            setColorVariants([...colorVariants, v]);
        }
        resetVariantForm();
    };
    const startEditVariant = (idx) => {
        setEditingVariantIdx(idx);
        setVariantForm({ ...colorVariants[idx], price: colorVariants[idx].price || '' });
    };
    const removeVariant = (idx) => {
        setColorVariants(colorVariants.filter((_, i) => i !== idx));
        if (editingVariantIdx === idx) resetVariantForm();
    };

    // ─── Save product ─────────────────────────────────────────────────────────
    const handleSave = async () => {
        const productImages = currentProduct.images && currentProduct.images.length > 0
            ? currentProduct.images
            : ['/assets/category_tech_1766034965148.png'];

        const flashSale = flashEnabled && flashDiscount ? {
            discount: Number(flashDiscount),
            startDate: flashStart || null,
            endDate: flashEnd || null
        } : null;

        const productData = {
            ...currentProduct,
            images: productImages,
            image: productImages[0],
            colors: colorVariants,
            price: Number(currentProduct.price),
            stock: Number(currentProduct.stock),
            flashSale
        };

        let success = false;
        if (isEditing) {
            success = await updateProduct(currentProduct.id, productData);
        } else {
            success = await addProduct(productData);
        }

        if (success) {
            showToast(isEditing ? 'Produit modifié avec succès !' : 'Produit ajouté avec succès !', 'success');
        } else {
            showToast('Erreur lors de l\'enregistrement du produit.', 'danger');
        }
        setShowModal(false);
        resetForm();
    };

    const resetForm = () => {
        setCurrentProduct(emptyProduct);
        setColorVariants([]);
        setNewImageUrl('');
        resetVariantForm();
        setNewAttribute({ label: '', value: '' });
        setFlashEnabled(false);
        setFlashDiscount('');
        setFlashStart('');
        setFlashEnd('');
    };

    const openEdit = (product) => {
        setIsEditing(true);
        setCurrentProduct({
            ...product,
            brand: product.brand || '',
            collection: product.collection || '',
            tags: product.tags || '',
            sku: product.sku || '',
            images: product.images || [product.image],
            attributes: product.attributes || [],
            availableSizes: product.availableSizes || [],
            barcode: product.barcode || ''
        });
        setColorVariants(product.colors || []);

        // Flash sale
        if (product.flashSale) {
            setFlashEnabled(true);
            setFlashDiscount(product.flashSale.discount?.toString() || '');
            setFlashStart(product.flashSale.startDate || '');
            setFlashEnd(product.flashSale.endDate || '');
        } else {
            setFlashEnabled(false);
            setFlashDiscount('');
            setFlashStart('');
            setFlashEnd('');
        }
        // Load page flags
        setCurrentProduct(prev => ({
            ...prev,
            isNew: !!product.isNew,
            isGift: !!product.isGift,
            isCollection: !!product.isCollection,
            isFavorite: !!product.isFavorite,
            isBestSeller: !!product.isBestSeller,
        }));
        setShowModal(true);
    };

    const openAdd = () => {
        setIsEditing(false);
        resetForm();
        const defaultCat = Object.keys(CATEGORIES)[0];
        const firstSubGroup = Object.values(CATEGORIES[defaultCat].groups)[0];
        setCurrentProduct({
            ...emptyProduct,
            category: defaultCat,
            subcategory: firstSubGroup[0] || 'Général',
        });
        setShowModal(true);
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const displayedProducts = filteredProducts.slice(0, showLimit);

    // Flash sale active checker
    const isFlashActive = (product) => {
        if (!product.flashSale || !product.flashSale.discount) return false;
        const now = new Date();
        const start = product.flashSale.startDate ? new Date(product.flashSale.startDate) : null;
        const end = product.flashSale.endDate ? new Date(product.flashSale.endDate) : null;
        if (start && now < start) return false;
        if (end && now > end) return false;
        return true;
    };

    return (
        <div className="admin-products-tech">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <h2 className="fw-bold mb-0 tech-title">{t('admin_products.title')}</h2>
                <Button variant="warning" onClick={openAdd} className="fw-bold px-4 py-2 rounded-pill shadow-sm">
                    <i className="bi bi-plus-lg me-2"></i>
                    {t('admin_products.add_product')}
                </Button>
            </div>

            <div className="bg-white p-3 rounded-4 shadow-sm mb-4 border">
                <Row className="g-2 g-md-3 align-items-center">
                    <Col xs={12} md={6}>
                        <InputGroup className="shadow-none border rounded overflow-hidden">
                            <InputGroup.Text className="bg-white border-0 pe-0">
                                <i className="bi bi-search text-muted opacity-50"></i>
                            </InputGroup.Text>
                            <Form.Control
                                placeholder={t('admin_products.search_placeholder')}
                                className="border-0 shadow-none py-2"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Button variant="white" className="border-0 text-primary" onClick={() => setShowSearchScanner(true)} title="Scanner un produit">
                                <i className="bi bi-camera-fill"></i>
                            </Button>
                        </InputGroup>
                    </Col>
                    <Col xs={12} md={4}>
                        <Form.Select className="shadow-none py-2 border rounded" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                            <option value="all">{t('admin_products.all_categories')}</option>
                            {Object.keys(CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </Form.Select>
                    </Col>
                    <Col xs={12} md={2} className="text-md-end">
                        <div className="text-muted small fw-medium px-1">{filteredProducts.length} produits</div>
                    </Col>
                </Row>
            </div>

            <div className="bg-white rounded-4 shadow-sm border overflow-hidden">
                {/* 📱 Mobile View (Cards) */}
                <div className="d-md-none p-2 container-fluid">
                    <div className="row g-3">
                        {displayedProducts.map(product => (
                            <div className="col-12" key={product.id}>
                                <Card className="border-0 shadow-sm rounded-4 overflow-hidden h-100">
                                    <div className="d-flex p-3 gap-3 position-relative">
                                        <div className="rounded-3 border bg-light d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '80px', height: '80px', overflow: 'hidden' }}>
                                            <img
                                                src={(product.images && product.images[0]) || product.image || '/assets/category_tech_1766034965148.png'}
                                                alt={product.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.src = '/assets/category_tech_1766034965148.png'; }}
                                            />
                                        </div>
                                        <div className="flex-grow-1 min-w-0 d-flex flex-column justify-content-center">
                                            <div className="fw-bold text-dark text-truncate mb-1" style={{ fontSize: '1rem' }}>{product.name}</div>
                                            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                                <Badge bg="light" className="text-dark border" style={{ fontSize: '0.65rem' }}>{product.category}</Badge>
                                                {isFlashActive(product) && (
                                                    <Badge bg="danger" style={{ fontSize: '0.65rem' }}>
                                                        <i className="bi bi-lightning-fill me-1"></i>-{product.flashSale.discount}%
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="d-flex justify-content-between align-items-end mt-auto">
                                                <div>
                                                    <div className="fw-bold text-dark fs-6">{product.price?.toLocaleString()} FCFA</div>
                                                    {isFlashActive(product) && (
                                                        <div className="text-danger small fw-bold">
                                                            {Math.round(product.price * (1 - product.flashSale.discount / 100)).toLocaleString()} FCFA
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`fw-bold small ${product.stock < 10 ? 'text-danger' : 'text-success'}`}>
                                                    Stock: {product.stock}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Actions Menu */}
                                        <div className="position-absolute top-0 end-0 p-2 d-flex gap-2">
                                            <Button size="sm" variant="light" className="rounded-circle p-2 shadow-sm border text-primary bg-white" onClick={() => openEdit(product)} title={t('admin_products.edit')} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <i className="bi bi-pencil-fill" style={{ fontSize: '0.8rem' }}></i>
                                            </Button>
                                            <Button
                                                size="sm" variant="light"
                                                className="rounded-circle p-2 shadow-sm border text-danger bg-white"
                                                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                onClick={async () => {
                                                    const ok = await confirm({ title: t('admin_products.delete'), message: t('admin_products.delete_confirm'), variant: 'danger', confirmText: t('admin_products.delete') });
                                                    if (ok) {
                                                        const success = await deleteProduct(product.id);
                                                        if (success) showToast('Produit supprimé !', 'success');
                                                    }
                                                }}
                                                title={t('admin_products.delete')}
                                            >
                                                <i className="bi bi-trash-fill" style={{ fontSize: '0.8rem' }}></i>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 💻 Desktop View (Table) */}
                <div className="d-none d-md-block">
                    <Table hover responsive className="mb-0 align-middle tech-product-table">
                        <thead className="bg-light text-muted small text-uppercase">
                            <tr>
                                <th className="ps-4 py-3" style={{ width: '80px' }}>{t('admin_products.image')}</th>
                                <th className="py-3">Produit</th>
                                <th className="py-3">Catégorie</th>
                                <th className="py-3">{t('admin_products.price')}</th>
                                <th className="py-3">{t('admin_products.stock')}</th>
                                <th className="py-3" style={{ width: '150px' }}>Code-Barre</th>
                                <th className="text-end pe-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedProducts.map(product => (
                                <tr key={product.id} className="tech-row-transition">
                                    <td className="ps-3 ps-md-4 py-3 border-bottom-0">
                                        <div className="rounded-3 border bg-light d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '50px', height: '50px' }}>
                                            <img
                                                src={(product.images && product.images[0]) || product.image || '/assets/category_tech_1766034965148.png'}
                                                alt={product.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.src = '/assets/category_tech_1766034965148.png'; }}
                                            />
                                        </div>
                                    </td>
                                    <td className="py-3 border-bottom-0">
                                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem', lineHeight: 1.2 }}>{product.name}</div>
                                        <div className="text-muted small text-truncate" style={{ maxWidth: '250px' }}>{product.description}</div>
                                        {isFlashActive(product) && (
                                            <Badge bg="danger" className="mt-1" style={{ fontSize: '0.6rem' }}>
                                                <i className="bi bi-lightning-fill me-1"></i>FLASH -{product.flashSale.discount}%
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="py-3 border-bottom-0">
                                        <div className="d-flex flex-column gap-1">
                                            <Badge bg="light" className="text-dark border-0 shadow-none py-1 px-2 mb-1" style={{ fontSize: '0.65rem' }}>{product.category}</Badge>
                                            <Badge bg="light" className="text-muted border-0 shadow-none py-1 px-2" style={{ fontSize: '0.6rem' }}>{product.subcategory}</Badge>
                                        </div>
                                    </td>
                                    <td className="py-3 border-bottom-0">
                                        <div className="fw-bold text-dark">{product.price?.toLocaleString()} <small>FCFA</small></div>
                                        {isFlashActive(product) && (
                                            <div className="text-danger small fw-bold">
                                                {Math.round(product.price * (1 - product.flashSale.discount / 100)).toLocaleString()} FCFA
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 border-bottom-0">
                                        <div className={`d-flex align-items-center gap-2 ${product.stock < 10 ? 'text-danger fw-bold' : 'text-success'}`}>
                                            <div className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: product.stock < 10 ? '#dc3545' : '#198754' }}></div>
                                            {product.stock}
                                        </div>
                                    </td>
                                    <td className="py-3 border-bottom-0">
                                        {product.barcode ? (
                                            <div>
                                                <Barcode value={product.barcode} width={0.8} height={20} displayValue={false} />
                                                <div className="text-muted" style={{ fontSize: '0.6rem' }}>{product.barcode}</div>
                                            </div>
                                        ) : (
                                            <small className="text-muted fst-italic">Non défini</small>
                                        )}
                                    </td>
                                    <td className="text-end pe-3 pe-md-4 py-3 border-bottom-0">
                                        <div className="d-flex justify-content-end gap-1">
                                            <Button size="sm" variant="outline-primary" className="rounded-circle p-2 shadow-none border-0" onClick={() => openEdit(product)} title={t('admin_products.edit')}>
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                            <Button
                                                size="sm" variant="outline-danger"
                                                className="rounded-circle p-2 shadow-none border-0"
                                                onClick={async () => {
                                                    const ok = await confirm({ title: t('admin_products.delete'), message: t('admin_products.delete_confirm'), variant: 'danger', confirmText: t('admin_products.delete') });
                                                    if (ok) {
                                                        const success = await deleteProduct(product.id);
                                                        if (success) showToast('Produit supprimé !', 'success');
                                                    }
                                                }}
                                                title={t('admin_products.delete')}
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

                {filteredProducts.length > showLimit && (
                    <div className="p-3 text-center border-top bg-light bg-opacity-50">
                        <Button variant="link" onClick={() => setShowLimit(prev => prev + 10)} className="text-decoration-none fw-bold text-primary small">
                            Afficher plus (+{filteredProducts.length - showLimit})
                        </Button>
                    </div>
                )}
            </div>

            <style>{`
                .tech-title { font-size: 1.5rem; letter-spacing: -0.5px; }
                .tech-row-transition { transition: all 0.2s ease; }
                .tech-row-transition:hover { background-color: #fcfcfc !important; }
                .variant-card { transition: box-shadow 0.2s; }
                .variant-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.1) !important; }
                @media (max-width: 767.98px) {
                    .tech-title { font-size: 1.25rem; }
                }
            `}</style>

            {/* ─── Product Modal ──────────────────────────────────────────────── */}
            <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? 'Modifier Produit' : 'Ajouter Produit'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        {/* ── LEFT: Basic info ───────────────────────────────────── */}
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nom du produit</Form.Label>
                                <Form.Control type="text" value={currentProduct.name} onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })} />
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Marque</Form.Label>
                                        <Form.Control type="text" placeholder="ex: Zara, Apple..." value={currentProduct.brand} onChange={e => setCurrentProduct({ ...currentProduct, brand: e.target.value })} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Collection</Form.Label>
                                        <Form.Control type="text" placeholder="ex: Été 2024" value={currentProduct.collection} onChange={e => setCurrentProduct({ ...currentProduct, collection: e.target.value })} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>SKU / Référence</Form.Label>
                                        <Form.Control type="text" placeholder="Code unique" value={currentProduct.sku} onChange={e => setCurrentProduct({ ...currentProduct, sku: e.target.value })} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Tags (Mots-clés)</Form.Label>
                                        <Form.Control type="text" placeholder="ex: casual, fête, vintage" value={currentProduct.tags} onChange={e => setCurrentProduct({ ...currentProduct, tags: e.target.value })} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Code-Barre EAN-13</Form.Label>
                                <InputGroup>
                                    <Form.Control type="text" placeholder="Code-barre auto ou manuel" value={currentProduct.barcode} onChange={e => setCurrentProduct({ ...currentProduct, barcode: e.target.value })} maxLength="13" />
                                    <Button variant="outline-primary" onClick={() => setShowScanner(true)} title="Scanner avec la caméra"><i className="bi bi-camera"></i></Button>
                                    <Button variant="outline-warning" onClick={() => setCurrentProduct({ ...currentProduct, barcode: generateEAN13() })} title="Générer code-barre">
                                        <i className="bi bi-upc-scan"></i> Générer
                                    </Button>
                                </InputGroup>
                                <Form.Text className="text-muted small">13 chiffres - Cliquez sur le bouton pour générer automatiquement</Form.Text>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Catégorie</Form.Label>
                                <Form.Select value={currentProduct.category} onChange={e => {
                                    const newCat = e.target.value;
                                    const firstSubGroup = Object.values(CATEGORIES[newCat].groups)[0];
                                    setCurrentProduct({ ...currentProduct, category: newCat, subcategory: firstSubGroup[0] || 'Général' });
                                }}>
                                    {Object.keys(CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Sous-Catégorie</Form.Label>
                                <Form.Select value={currentProduct.subcategory} onChange={e => setCurrentProduct({ ...currentProduct, subcategory: e.target.value })}>
                                    {Object.entries(CATEGORIES[currentProduct.category]?.groups || {}).map(([group, items]) => (
                                        <optgroup key={group} label={group}>
                                            {items.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                        </optgroup>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Prix de base (FCFA)</Form.Label>
                                        <Form.Control type="number" value={currentProduct.price} onChange={e => setCurrentProduct({ ...currentProduct, price: e.target.value })} />
                                        <Form.Text className="text-muted small">Peut être remplacé par le prix de la variante</Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={8}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Stock</Form.Label>
                                        <Form.Control type="number" value={currentProduct.stock} onChange={e => setCurrentProduct({ ...currentProduct, stock: e.target.value })} />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Col>

                        {/* ── RIGHT: Images ──────────────────────────────────────── */}
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="d-flex justify-content-between align-items-center">
                                    <span>Images principales du produit</span>
                                    <Badge bg="info" className="ms-2">{currentProduct.images?.length || 0} image(s)</Badge>
                                </Form.Label>
                                <div className="btn-group btn-group-sm w-100 mb-2">
                                    <Button variant={imageSource === 'upload' ? 'primary' : 'outline-primary'} onClick={() => setImageSource('upload')}>
                                        <i className="bi bi-upload me-1"></i> Charger
                                    </Button>
                                    <Button variant={imageSource === 'url' ? 'primary' : 'outline-primary'} onClick={() => setImageSource('url')}>
                                        <i className="bi bi-link-45deg me-1"></i> Lien URL
                                    </Button>
                                </div>
                                {imageSource === 'upload' ? (
                                    <Form.Control type="file" accept="image/*" multiple onChange={handleFileUpload} />
                                ) : (
                                    <div className="d-flex gap-2">
                                        <Form.Control type="text" placeholder="https://..." value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())} />
                                        <Button variant="outline-secondary" onClick={addImage}>Ajouter</Button>
                                    </div>
                                )}
                                <div className="border p-3 rounded bg-light mt-2" style={{ minHeight: '150px', maxHeight: '220px', overflowY: 'auto' }}>
                                    {currentProduct.images && currentProduct.images.length > 0 ? (
                                        <div className="row g-2">
                                            {currentProduct.images.map((img, idx) => (
                                                <div key={idx} className="col-4">
                                                    <div className="position-relative border rounded p-1 bg-white shadow-sm">
                                                        <img src={img} alt="preview" style={{ width: '100%', height: '70px', objectFit: 'cover' }} className="rounded" />
                                                        {idx === 0 && (
                                                            <div className="position-absolute top-0 start-0 bg-primary text-white p-1 rounded-end" style={{ fontSize: '0.55rem', fontWeight: 'bold' }}>PRINCIPALE</div>
                                                        )}
                                                        <Button variant="danger" size="sm" className="position-absolute top-0 start-100 translate-middle badge rounded-pill p-1 shadow" style={{ fontSize: '0.6rem', border: '2px solid white' }} onClick={() => removeImage(idx)}>
                                                            <i className="bi bi-x"></i>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <i className="bi bi-images text-muted" style={{ fontSize: '2rem' }}></i>
                                            <p className="text-muted small mt-2">Aucune image ajoutée.</p>
                                        </div>
                                    )}
                                </div>
                            </Form.Group>

                            {/* Flash Sale Section */}
                            <div className={`p-3 rounded-3 border mb-3 ${flashEnabled ? 'border-danger bg-danger bg-opacity-10' : 'border-secondary bg-light'}`}>
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                        <i className="bi bi-lightning-fill text-danger"></i>
                                        Vente Flash (Réduction temporaire)
                                    </h6>
                                    <Form.Check
                                        type="switch"
                                        id="flashSaleSwitch"
                                        checked={flashEnabled}
                                        onChange={e => setFlashEnabled(e.target.checked)}
                                        label={flashEnabled ? 'Activée' : 'Désactivée'}
                                        className="fw-bold"
                                    />
                                </div>
                                {flashEnabled && (
                                    <Row className="g-2">
                                        <Col md={4}>
                                            <Form.Label className="small fw-bold">Réduction (%)</Form.Label>
                                            <InputGroup size="sm">
                                                <Form.Control
                                                    type="number" min="1" max="99" placeholder="ex: 20"
                                                    value={flashDiscount}
                                                    onChange={e => setFlashDiscount(e.target.value)}
                                                />
                                                <InputGroup.Text>%</InputGroup.Text>
                                            </InputGroup>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label className="small fw-bold">Début</Form.Label>
                                            <Form.Control size="sm" type="datetime-local" value={flashStart} onChange={e => setFlashStart(e.target.value)} />
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label className="small fw-bold">Fin</Form.Label>
                                            <Form.Control size="sm" type="datetime-local" value={flashEnd} onChange={e => setFlashEnd(e.target.value)} />
                                        </Col>
                                        {flashDiscount && currentProduct.price && (
                                            <Col md={12}>
                                                <div className="mt-1 p-2 bg-white rounded border text-center">
                                                    <span className="text-muted text-decoration-line-through me-2 small">{Number(currentProduct.price).toLocaleString()} FCFA</span>
                                                    <span className="fw-bold text-danger">→ {Math.round(Number(currentProduct.price) * (1 - Number(flashDiscount) / 100)).toLocaleString()} FCFA</span>
                                                </div>
                                            </Col>
                                        )}
                                    </Row>
                                )}
                            </div>

                            {/* ── Page Selections ───────────────────────────────── */}
                            <div className="p-3 rounded-3 border bg-light mb-3">
                                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                    <i className="bi bi-bookmark-star-fill text-warning"></i>
                                    Inclure dans les pages spéciales
                                </h6>
                                <Row className="g-2">
                                    {[
                                        { flag: 'isNew',        icon: '🌟', label: 'Nouveautés',       color: '#6a11cb' },
                                        { flag: 'isGift',       icon: '🎁', label: 'Idées Cadeaux',    color: '#b91d73' },
                                        { flag: 'isCollection', icon: '✨', label: 'Collections',      color: '#11998e' },
                                        { flag: 'isFavorite',   icon: '❤️', label: 'Coups de Cœur',   color: '#f7971e' },
                                        { flag: 'isBestSeller', icon: '🔥', label: 'Meilleures Ventes', color: '#f12711' },
                                    ].map(({ flag, icon, label, color }) => (
                                        <Col xs={6} key={flag}>
                                            <div
                                                className="d-flex align-items-center gap-2 p-2 rounded-3 border cursor-pointer"
                                                style={{
                                                    background: currentProduct[flag] ? `${color}15` : '#fff',
                                                    borderColor: currentProduct[flag] ? color : '#dee2e6',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onClick={() => setCurrentProduct(prev => ({ ...prev, [flag]: !prev[flag] }))}
                                            >
                                                <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                                                <span className="fw-semibold small" style={{ color: currentProduct[flag] ? color : '#666' }}>{label}</span>
                                                {currentProduct[flag] && <i className="bi bi-check-circle-fill ms-auto" style={{ color, fontSize: '0.8rem' }}></i>}
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        </Col>
                    </Row>

                    {/* ── COLOR VARIANTS SECTION ─────────────────────────────────────────────── */}
                    <div className="mb-4 border-top pt-3">
                        <h5 className="mb-1 d-flex align-items-center gap-2">
                            <i className="bi bi-palette2 text-primary"></i>
                            Variantes de Couleur
                        </h5>
                        <p className="text-muted small mb-3">Chaque variante peut avoir sa propre couleur, son prix et ses photos. Les photos s'affichent quand le client clique sur la couleur.</p>

                        {/* Variant form */}
                        <div className={`p-3 rounded-3 border mb-3 ${editingVariantIdx !== null ? 'border-primary bg-primary bg-opacity-10' : 'bg-light'}`}>
                            <h6 className="fw-bold small mb-3 text-uppercase text-muted">
                                {editingVariantIdx !== null ? `✏️ Modifier variante "${colorVariants[editingVariantIdx]?.name}"` : '➕ Nouvelle variante'}
                            </h6>
                            <Row className="g-2 mb-3">
                                <Col md={3}>
                                    <Form.Label className="small fw-bold">Nom couleur *</Form.Label>
                                    <Form.Control size="sm" type="text" placeholder="ex: Rouge, Bleu..." value={variantForm.name} onChange={e => setVariantForm({ ...variantForm, name: e.target.value })} />
                                </Col>
                                <Col md={2}>
                                    <Form.Label className="small fw-bold">Couleur</Form.Label>
                                    <Form.Control size="sm" type="color" value={variantForm.hex} onChange={e => setVariantForm({ ...variantForm, hex: e.target.value })} className="p-1 w-100" />
                                </Col>
                                <Col md={3}>
                                    <Form.Label className="small fw-bold">Prix spécifique (FCFA)</Form.Label>
                                    <Form.Control size="sm" type="number" placeholder="Laisser vide = prix de base" value={variantForm.price} onChange={e => setVariantForm({ ...variantForm, price: e.target.value })} />
                                </Col>
                                <Col md={4}>
                                    <Form.Label className="small fw-bold">Photos de cette variante</Form.Label>
                                    <div className="d-flex gap-1 mb-1">
                                        <div className="btn-group btn-group-sm">
                                            <Button size="sm" variant={variantImgSource === 'upload' ? 'secondary' : 'outline-secondary'} onClick={() => setVariantImgSource('upload')}>Upload</Button>
                                            <Button size="sm" variant={variantImgSource === 'url' ? 'secondary' : 'outline-secondary'} onClick={() => setVariantImgSource('url')}>URL</Button>
                                        </div>
                                    </div>
                                    {variantImgSource === 'upload' ? (
                                        <Form.Control size="sm" type="file" multiple accept="image/*" onChange={handleVariantFileUpload} />
                                    ) : (
                                        <div className="d-flex gap-1">
                                            <Form.Control size="sm" type="text" placeholder="URL image" value={variantImgUrl} onChange={e => setVariantImgUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVariantImage())} />
                                            <Button size="sm" variant="outline-dark" onClick={addVariantImage}>+</Button>
                                        </div>
                                    )}
                                </Col>
                            </Row>

                            {/* Preview of variant images being added */}
                            {variantForm.images && variantForm.images.length > 0 && (
                                <div className="mb-2 d-flex flex-wrap gap-2">
                                    {variantForm.images.map((img, idx) => (
                                        <div key={idx} className="position-relative" style={{ width: '60px', height: '60px' }}>
                                            <img src={img} alt="" className="w-100 h-100 rounded border object-fit-cover" style={{ objectFit: 'cover' }} />
                                            <div
                                                className="position-absolute top-0 end-0 translate-middle bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px' }}
                                                onClick={() => removeVariantImage(idx)}
                                            >×</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(!variantForm.images || variantForm.images.length === 0) && (
                                <div className="text-muted small fst-italic mb-2">Aucune photo ajoutée pour cette variante.</div>
                            )}

                            <div className="d-flex gap-2">
                                <Button variant={editingVariantIdx !== null ? 'primary' : 'dark'} size="sm" onClick={saveVariant}>
                                    <i className={`bi bi-${editingVariantIdx !== null ? 'check-lg' : 'plus-lg'} me-1`}></i>
                                    {editingVariantIdx !== null ? 'Enregistrer la modification' : 'Ajouter cette variante'}
                                </Button>
                                {editingVariantIdx !== null && (
                                    <Button variant="outline-secondary" size="sm" onClick={resetVariantForm}>Annuler</Button>
                                )}
                            </div>
                        </div>

                        {/* Variants list */}
                        {colorVariants.length > 0 ? (
                            <div className="d-flex flex-wrap gap-3">
                                {colorVariants.map((variant, idx) => (
                                    <div
                                        key={idx}
                                        className={`variant-card border rounded-3 p-2 bg-white shadow-sm ${editingVariantIdx === idx ? 'border-primary' : ''}`}
                                        style={{ minWidth: '160px', maxWidth: '200px' }}
                                    >
                                        <div className="d-flex align-items-center mb-2 gap-2">
                                            <div className="rounded-circle border" style={{ width: '22px', height: '22px', backgroundColor: variant.hex, flexShrink: 0 }}></div>
                                            <div className="fw-bold small text-truncate">{variant.name}</div>
                                            <div className="ms-auto d-flex gap-1">
                                                <Button variant="link" className="p-0 text-primary" size="sm" onClick={() => startEditVariant(idx)} title="Modifier">
                                                    <i className="bi bi-pencil-fill" style={{ fontSize: '0.75rem' }}></i>
                                                </Button>
                                                <Button variant="link" className="p-0 text-danger" size="sm" onClick={() => removeVariant(idx)} title="Supprimer">
                                                    <i className="bi bi-trash-fill" style={{ fontSize: '0.75rem' }}></i>
                                                </Button>
                                            </div>
                                        </div>
                                        {variant.price && (
                                            <div className="text-success fw-bold small mb-1">{Number(variant.price).toLocaleString()} FCFA</div>
                                        )}
                                        {variant.images && variant.images.length > 0 ? (
                                            <>
                                                <div className="small text-muted mb-1">{variant.images.length} photo(s)</div>
                                                <div className="d-flex flex-wrap gap-1">
                                                    {variant.images.slice(0, 4).map((img, imgIdx) => (
                                                        <img key={imgIdx} src={img} alt="" className="rounded border" style={{ width: '36px', height: '36px', objectFit: 'cover' }} />
                                                    ))}
                                                    {variant.images.length > 4 && (
                                                        <div className="d-flex align-items-center justify-content-center rounded border bg-light text-muted" style={{ width: '36px', height: '36px', fontSize: '0.6rem' }}>
                                                            +{variant.images.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-muted small fst-italic">Sans photos</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted small fst-italic">Aucune variante de couleur définie.</p>
                        )}
                    </div>

                    {/* ── DESCRIPTION ───────────────────────────────────────────────────────── */}
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control as="textarea" rows={3} value={currentProduct.description} onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })} />
                    </Form.Group>

                    {/* ── SIZES ─────────────────────────────────────────────────────────────── */}
                    {(getTemplateKey(currentProduct.category) === 'Clothing' || getTemplateKey(currentProduct.category) === 'Shoes') && (
                        <div className="mb-4 border-top pt-3">
                            <h5 className="mb-3 d-flex align-items-center gap-2">
                                <i className="bi bi-rulers text-primary"></i>
                                Tailles / Pointures Disponibles
                            </h5>
                            <div className="d-flex flex-wrap gap-2 mb-3">
                                {(getTemplateKey(currentProduct.category) === 'Shoes' ? SIZE_PRESETS.Shoes : SIZE_PRESETS.Clothing).map(size => (
                                    <Button
                                        key={size}
                                        variant={currentProduct.availableSizes?.includes(size) ? 'primary' : 'outline-secondary'}
                                        size="sm"
                                        className="px-3 rounded-pill"
                                        onClick={() => toggleSize(size)}
                                    >
                                        {size}
                                    </Button>
                                ))}
                            </div>
                            <InputGroup size="sm" style={{ maxWidth: '300px' }}>
                                <Form.Control
                                    placeholder="Ajouter une taille perso..."
                                    id="customSizeInput"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            if (e.target.value) toggleSize(e.target.value.toUpperCase());
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <Button variant="outline-primary" onClick={() => {
                                    const input = document.getElementById('customSizeInput');
                                    if (input.value) toggleSize(input.value.toUpperCase());
                                    input.value = '';
                                }}>Ajouter</Button>
                            </InputGroup>
                        </div>
                    )}

                    {/* ── ATTRIBUTES ────────────────────────────────────────────────────────── */}
                    <div className="mb-4 border-top pt-3">
                        <h5 className="mb-3 d-flex align-items-center gap-2">
                            <i className="bi bi-list-stars text-primary"></i>
                            Détails & Spécifications
                        </h5>
                        {getTemplateKey(currentProduct.category) && (
                            <div className="p-3 bg-light rounded mb-3 border">
                                <h6 className="small fw-bold text-muted mb-3 border-bottom pb-2">CHAMPS RECOMMANDÉS POUR {currentProduct.category.toUpperCase()}</h6>
                                <Row className="g-3">
                                    {ATTRIBUTE_TEMPLATES[getTemplateKey(currentProduct.category)].map(field => (
                                        <Col md={6} key={field}>
                                            <Form.Group>
                                                <Form.Label className="small fw-medium mb-1">{field}</Form.Label>
                                                <Form.Control size="sm" type="text" placeholder={`Saisir ${field.toLowerCase()}...`} value={getFieldValue(field)} onChange={e => handleTemplateFieldChange(field, e.target.value)} style={{ borderRadius: '6px' }} />
                                            </Form.Group>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        )}
                        <div className="bg-white border rounded p-3">
                            <h6 className="small fw-bold text-muted mb-3">AUTRES DÉTAILS PERSONNALISÉS</h6>
                            <Row className="g-2 mb-3 align-items-end">
                                <Col md={5}>
                                    <Form.Control size="sm" type="text" placeholder="Libellé (ex: Garantie)" value={newAttribute.label} onChange={e => setNewAttribute({ ...newAttribute, label: e.target.value })} />
                                </Col>
                                <Col md={5}>
                                    <Form.Control size="sm" type="text" placeholder="Valeur (ex: 2 ans)" value={newAttribute.value} onChange={e => setNewAttribute({ ...newAttribute, value: e.target.value })} />
                                </Col>
                                <Col md={2}>
                                    <Button size="sm" variant="outline-dark" className="w-100" onClick={addAttribute}><i className="bi bi-plus-lg"></i></Button>
                                </Col>
                            </Row>
                            {currentProduct.attributes && currentProduct.attributes.length > 0 && (
                                <div className="d-flex flex-wrap gap-2">
                                    {currentProduct.attributes
                                        .filter(attr => !getTemplateKey(currentProduct.category) || !ATTRIBUTE_TEMPLATES[getTemplateKey(currentProduct.category)].includes(attr.label))
                                        .map((attr, idx) => (
                                            <div key={idx} className="d-flex align-items-center bg-light border rounded ps-3 pe-2 py-1">
                                                <span className="text-muted small me-1">{attr.label}:</span>
                                                <span className="fw-bold small">{attr.value}</span>
                                                <Button variant="link" className="text-danger p-0 ms-2 d-flex align-items-center" style={{ textDecoration: 'none' }}
                                                    onClick={() => { const realIndex = currentProduct.attributes.indexOf(attr); removeAttribute(realIndex); }}>
                                                    <i className="bi bi-x"></i>
                                                </Button>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</Button>
                    <Button variant="primary" onClick={handleSave}>Enregistrer</Button>
                </Modal.Footer>
            </Modal>

            <BarcodeScanner show={showScanner} onHide={() => setShowScanner(false)} onScan={(code) => setCurrentProduct({ ...currentProduct, barcode: code })} />
            <BarcodeScanner show={showSearchScanner} onHide={() => setShowSearchScanner(false)} onScan={(code) => setSearchTerm(code)} />
        </div>
    );
};

export default AdminProducts;
