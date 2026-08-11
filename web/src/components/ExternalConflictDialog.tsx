import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ExternalConflictDialogProps {
  isOpen: boolean;
  filename: string;
  onReload: () => void;
  onKeepLocal: () => void;
}

export const ExternalConflictDialog: React.FC<ExternalConflictDialogProps> = ({
  isOpen,
  filename,
  onReload,
  onKeepLocal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-3 text-[var(--accent)]">
          <RefreshCw className="w-6 h-6 shrink-0" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">File Modified Externally</h3>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
          <strong className="text-[var(--text-primary)]">{filename}</strong> has been modified outside AburMD. How would you like to handle your local edits?
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onKeepLocal}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Keep My Changes
          </button>
          <button
            onClick={onReload}
            className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
          >
            Reload File
          </button>
        </div>
      </div>
    </div>
  );
};
