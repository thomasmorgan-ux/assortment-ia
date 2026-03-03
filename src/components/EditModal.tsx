import { X } from 'lucide-react';
import type { ModalKind } from '../types';

interface EditModalProps {
  kind: ModalKind;
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export function EditModal({ kind, title, onClose, children }: EditModalProps) {
  if (!kind) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {children ?? (
            <p className="text-slate-600">
              Add further content and form fields here. This modal is ready for
              allocation edits, product group details, or assortment actions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
