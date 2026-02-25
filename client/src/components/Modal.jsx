import { useEffect } from 'react';
import Button from './Button';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'lg',
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[200]"
        onClick={onClose}
        style={{ pointerEvents: 'auto' }}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-[210] flex items-center justify-center pointer-events-none">
        <div className={`bg-white rounded-lg shadow-2xl ${sizeClasses[size]} w-full mx-4 max-h-[90vh] flex flex-col pointer-events-auto`}>
        {/* Header */}
        <div className="border-b px-8 py-5">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        </div>

        {/* Body */}
        <div className="flex-1 px-8 py-6 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t px-8 py-4 flex justify-end gap-3 bg-gray-50">
            {footer}
          </div>
        )}
        {!footer && (
          <div className="border-t px-8 py-4 flex justify-end gap-3 bg-gray-50">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
