import React, { useState } from 'react';
import { AppSettings, AccentColor, ThemeMode } from '../types';
import { X, Palette, FileCode, Info, ShieldCheck, Sliders } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

const ACCENT_OPTIONS: { id: AccentColor; name: string; color: string }[] = [
  { id: 'orange', name: 'Deep Orange', color: '#ea580c' },
  { id: 'amber', name: 'Amber', color: '#d97706' },
  { id: 'red', name: 'Red', color: '#dc2626' },
  { id: 'blue', name: 'Blue', color: '#2563eb' },
  { id: 'indigo', name: 'Indigo', color: '#4f46e5' },
  { id: 'violet', name: 'Violet', color: '#7c3aed' },
  { id: 'green', name: 'Green', color: '#16a34a' },
  { id: 'cyan', name: 'Cyan', color: '#0891b2' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'typography' | 'markdown' | 'about'>('appearance');

  if (!isOpen) return null;

  const handleThemeChange = (theme: ThemeMode) => {
    onUpdateSettings({ ...settings, theme });
  };

  const handleAccentChange = (accent: AccentColor) => {
    onUpdateSettings({ ...settings, accent });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-modal-in">
        {/* Header */}
        <div className="h-12 px-5 border-b border-[var(--border)] flex items-center justify-between font-bold text-sm text-[var(--text-primary)] select-none bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--accent-muted)] text-[var(--accent)] font-bold text-[10px] flex items-center justify-center">
              A
            </div>
            <span>Settings</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Minimalist Sidebar with Active Right-Merged Tabs */}
          <div className="w-44 bg-[var(--bg-surface)] border-r border-[var(--border)] p-2 space-y-1 select-none relative z-10">
            <button
              onClick={() => setActiveTab('appearance')}
              className={`group relative flex items-center gap-2.5 w-full px-3 py-2 text-xs cursor-pointer transition-all border-l border-y rounded-l-md -mr-[1px] ${
                activeTab === 'appearance'
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border)] border-r-[var(--bg-primary)] font-semibold after:content-[""] after:absolute after:-right-[2px] after:top-0 after:bottom-0 after:w-[2px] after:bg-[var(--bg-primary)] after:border-r after:border-[var(--bg-primary)] after:z-30'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] border-transparent font-medium'
              }`}
            >
              <Palette className="w-4 h-4 shrink-0 opacity-80" />
              <span>Appearance</span>
            </button>

            <button
              onClick={() => setActiveTab('typography')}
              className={`group relative flex items-center gap-2.5 w-full px-3 py-2 text-xs cursor-pointer transition-all border-l border-y rounded-l-md -mr-[1px] ${
                activeTab === 'typography'
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border)] border-r-[var(--bg-primary)] font-semibold after:content-[""] after:absolute after:-right-[2px] after:top-0 after:bottom-0 after:w-[2px] after:bg-[var(--bg-primary)] after:border-r after:border-[var(--bg-primary)] after:z-30'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] border-transparent font-medium'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0 opacity-80" />
              <span>Typography</span>
            </button>

            <button
              onClick={() => setActiveTab('markdown')}
              className={`group relative flex items-center gap-2.5 w-full px-3 py-2 text-xs cursor-pointer transition-all border-l border-y rounded-l-md -mr-[1px] ${
                activeTab === 'markdown'
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border)] border-r-[var(--bg-primary)] font-semibold after:content-[""] after:absolute after:-right-[2px] after:top-0 after:bottom-0 after:w-[2px] after:bg-[var(--bg-primary)] after:border-r after:border-[var(--bg-primary)] after:z-30'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] border-transparent font-medium'
              }`}
            >
              <FileCode className="w-4 h-4 shrink-0 opacity-80" />
              <span>Markdown</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`group relative flex items-center gap-2.5 w-full px-3 py-2 text-xs cursor-pointer transition-all border-l border-y rounded-l-md -mr-[1px] ${
                activeTab === 'about'
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border)] border-r-[var(--bg-primary)] font-semibold after:content-[""] after:absolute after:-right-[2px] after:top-0 after:bottom-0 after:w-[2px] after:bg-[var(--bg-primary)] after:border-r after:border-[var(--bg-primary)] after:z-30'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] border-transparent font-medium'
              }`}
            >
              <Info className="w-4 h-4 shrink-0 opacity-80" />
              <span>About</span>
            </button>
          </div>

          {/* Settings Content Panel */}
          <div className="flex-1 bg-[var(--bg-primary)] p-6 overflow-y-auto text-xs text-[var(--text-primary)] z-0">
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <label className="font-semibold block mb-2 text-[var(--text-primary)]">Theme Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleThemeChange(mode)}
                        className={`py-2 px-3 rounded-lg border text-xs capitalize font-medium transition-all ${
                          settings.theme === mode
                            ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)] font-semibold shadow-xs'
                            : 'border-[var(--border)] hover:bg-[var(--bg-surface)] text-[var(--text-muted)]'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-[var(--text-primary)]">Accent Palette</label>
                  <p className="text-[11px] text-[var(--text-muted)] mb-3">
                    Fixed Zinc neutral base with vibrant primary highlight palette.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ACCENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleAccentChange(opt.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs font-medium transition-all ${
                          settings.accent === opt.id
                            ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)] font-semibold shadow-xs'
                            : 'border-[var(--border)] hover:bg-[var(--bg-surface)] text-[var(--text-muted)]'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: opt.color }} />
                        <span className="truncate">{opt.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'typography' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold text-[var(--text-primary)]">Font Size</label>
                    <span className="font-mono text-[var(--accent)] font-bold">{settings.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={settings.fontSize}
                    onChange={(e) => onUpdateSettings({ ...settings, fontSize: Number(e.target.value) })}
                    className="w-full accent-[var(--accent)] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                    <span>12px</span>
                    <span>16px (Default)</span>
                    <span>24px</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold text-[var(--text-primary)]">Max Reading Width</label>
                    <span className="font-mono text-[var(--accent)] font-bold">{settings.readingWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="600"
                    max="1400"
                    step="50"
                    value={settings.readingWidth}
                    onChange={(e) => onUpdateSettings({ ...settings, readingWidth: Number(e.target.value) })}
                    className="w-full accent-[var(--accent)] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                    <span>600px</span>
                    <span>900px (Default)</span>
                    <span>1400px</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'markdown' && (
              <div className="space-y-3 select-none">
                <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-surface)] transition-colors">
                  <div>
                    <span className="font-semibold block">Open links externally</span>
                    <span className="text-[11px] text-[var(--text-muted)]">Launch HTTP/HTTPS links in default system browser</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.openLinksExternal}
                    onChange={(e) => onUpdateSettings({ ...settings, openLinksExternal: e.target.checked })}
                    className="accent-[var(--accent)] w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-surface)] transition-colors">
                  <div>
                    <span className="font-semibold block">Show document outline</span>
                    <span className="text-[11px] text-[var(--text-muted)]">Display collapsible TOC sidebar by default</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showOutline}
                    onChange={(e) => onUpdateSettings({ ...settings, showOutline: e.target.checked })}
                    className="accent-[var(--accent)] w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-surface)] transition-colors">
                  <div>
                    <span className="font-semibold block">Restore last session</span>
                    <span className="text-[11px] text-[var(--text-muted)]">Reopen previously opened document tabs on launch</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.restoreSession}
                    onChange={(e) => onUpdateSettings({ ...settings, restoreSession: e.target.checked })}
                    className="accent-[var(--accent)] w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4 text-center py-4 select-none">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)] flex items-center justify-center mx-auto mb-2 font-bold text-xl shadow-md border border-[var(--accent-muted)]">
                  A
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">AburMD</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Minimalist Markdown document reader and editor.</p>
                  <p className="text-[11px] font-mono text-[var(--text-muted)] mt-1">Version 1.0.0 (Windows x64)</p>
                </div>

                <div className="pt-4 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)] space-y-1">
                  <p>© 2026 AburMD Software. All rights reserved.</p>
                  <p className="flex items-center justify-center gap-1 text-[var(--accent)] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    100% Local & Offline • Zero Telemetry
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
