import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        variant: 'primary'
    });

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setConfirmDialog({
                show: true,
                title: options.title || 'Confirmation',
                message: options.message || 'Êtes-vous sûr ?',
                confirmText: options.confirmText || 'Confirmer',
                cancelText: options.cancelText || 'Annuler',
                variant: options.variant || 'primary',
                onConfirm: () => {
                    setConfirmDialog(prev => ({ ...prev, show: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmDialog(prev => ({ ...prev, show: false }));
                    resolve(false);
                }
            });
        });
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, confirm }}>
            {children}

            {/* Toast Container */}
            <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`toast-item animate__animated animate__fadeInUp bg-${toast.type} text-white p-3 rounded shadow-lg mb-2 d-flex align-items-center`}
                        style={{ minWidth: '250px', borderLeft: '5px solid rgba(0,0,0,0.1)' }}
                    >
                        <div className="me-3">
                            {toast.type === 'success' && <i className="bi bi-check-circle-fill fs-5"></i>}
                            {toast.type === 'danger' && <i className="bi bi-exclamation-triangle-fill fs-5"></i>}
                            {toast.type === 'info' && <i className="bi bi-info-circle-fill fs-5"></i>}
                            {toast.type === 'warning' && <i className="bi bi-exclamation-circle-fill fs-5"></i>}
                        </div>
                        <div className="fw-bold">{toast.message}</div>
                    </div>
                ))}
            </div>

            {/* Confirmation Modal */}
            <Modal
                show={confirmDialog.show}
                onHide={confirmDialog.onCancel}
                centered
                className="confirm-modal"
                backdrop="static"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{confirmDialog.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-3">
                    <p className="mb-0 text-muted fs-5">{confirmDialog.message}</p>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" onClick={confirmDialog.onCancel} className="fw-bold px-4">
                        {confirmDialog.cancelText}
                    </Button>
                    <Button variant={confirmDialog.variant} onClick={confirmDialog.onConfirm} className="fw-bold px-4 shadow-sm text-white">
                        {confirmDialog.confirmText}
                    </Button>
                </Modal.Footer>
            </Modal>

            <style>{`
                .toast-item {
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .confirm-modal .modal-content {
                    border: none;
                    border-radius: 16px;
                    box-shadow: 0 15px 50px rgba(0,0,0,0.15);
                }
                .bg-success { background: linear-gradient(135deg, #28a745, #20c997) !important; }
                .bg-danger { background: linear-gradient(135deg, #dc3545, #f86d70) !important; }
                .bg-info { background: linear-gradient(135deg, #17a2b8, #36b9cc) !important; }
                .bg-warning { background: linear-gradient(135deg, #ffc107, #ff9800) !important; color: #000 !important; }
            `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};
