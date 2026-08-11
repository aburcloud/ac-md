import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface UnsavedDialogProps {
  isOpen: boolean;
  filename: string;
  onSave: () => void;
  onDontSave: () => void;
  onCancel: () => void;
}

export const UnsavedDialog: React.FC<UnsavedDialogProps> = ({
  isOpen,
  filename,
  onSave,
  onDontSave,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 animate-modal-in">
        <div className="flex items-center gap-3 mb-3 text-[var(--accent)]">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">Unsaved Changes</h3>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
          Do you want to save changes to <strong className="text-[var(--text-primary)]">{filename}</strong> before closing?
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onDontSave}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
          >
            Don't Save
          </button>
          <button
            onClick={onSave}
            className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
