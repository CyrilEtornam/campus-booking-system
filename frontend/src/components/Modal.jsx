import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = size === 'sm' ? 'modal--sm' : size === 'lg' ? 'modal--lg' : '';

  return ReactDOM.createPortal(
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`modal ${sizeClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={contentRef}
        tabIndex={-1}
      >
        {title && (
          <div className="modal-header">
            <h3 id="modal-title">{title}</h3>
            <button className="modal-close" onClick={onClose} aria-label="Close dialog">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title = 'Confirm', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger' }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>{cancelLabel}</button>
        <button className={`btn btn-${variant}`} onClick={onConfirm}>{confirmLabel}</button>
      </>
    }
  >
    <p>{message}</p>
  </Modal>
);

export const AlertModal = ({ isOpen, onClose, title = 'Notice', message }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="sm"
    footer={<button className="btn btn-primary" onClick={onClose}>OK</button>}
  >
    <p>{message}</p>
  </Modal>
);

export const PromptModal = ({ isOpen, onClose, onSubmit, title = 'Input', message, placeholder = '' }) => {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    onSubmit(value);
    setValue('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { setValue(''); onClose(); }}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={() => { setValue(''); onClose(); }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Submit</button>
        </>
      }
    >
      {message && <p style={{ marginBottom: '0.75rem' }}>{message}</p>}
      <input
        className="form-control"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus
      />
    </Modal>
  );
};

export default Modal;
