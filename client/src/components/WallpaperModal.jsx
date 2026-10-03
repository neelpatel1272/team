import { useState } from 'react';
import { X, Check, Image, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

export default function WallpaperModal({ open, onClose }) {
  const { chatBackground, setChatBackground, wallpaperPresets } = useTheme();
  const { showToast } = useToast();
  const [customUrl, setCustomUrl] = useState(
    chatBackground?.startsWith('http') || chatBackground?.startsWith('data:') ? chatBackground : ''
  );

  if (!open) return null;

  const handleSelectPreset = (presetId) => {
    setChatBackground(presetId);
    showToast('Chat background updated.', 'success');
  };

  const handleApplyCustomUrl = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    setChatBackground(customUrl.trim());
    showToast('Custom wallpaper applied.', 'success');
  };

  return (
    <div className="overlay" style={{ zIndex: 60 }} onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 520, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <div className="flex items-center gap-2">
            <Sparkles size={18} color="var(--color-primary)" />
            <span className="modal__title">Chat Wallpaper & Background</span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal__body" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <p className="muted text-xs" style={{ margin: '0 0 16px' }}>
            Personalize your chat background with clean themes, gradients, subtle patterns, or custom wallpapers.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
            {wallpaperPresets.map((preset) => {
              const isSelected = chatBackground === preset.id;
              return (
                <div
                  key={preset.id}
                  className="card cursor-pointer hover-shadow"
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onClick={() => handleSelectPreset(preset.id)}
                >
                  <div
                    style={{
                      height: 64,
                      borderRadius: 6,
                      background: preset.style === 'transparent' ? 'var(--color-surface-alt)' : preset.style,
                      border: '1px solid var(--color-border)',
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <span
                        style={{
                          background: 'var(--color-primary)',
                          color: '#fff',
                          borderRadius: '50%',
                          width: 22,
                          height: 22,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={13} />
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold" style={{ textAlign: 'center' }}>{preset.name}</div>
                  <div className="text-xs muted" style={{ textAlign: 'center', fontSize: 10 }}>{preset.category}</div>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <label className="text-xs font-bold" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Image size={14} color="var(--color-primary)" /> Or use a custom image URL
            </label>
            <form onSubmit={handleApplyCustomUrl} className="flex gap-2">
              <input
                className="input"
                style={{ flex: 1, padding: '8px 12px', fontSize: 12 }}
                placeholder="https://example.com/wallpaper.jpg"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary text-xs"
                disabled={!customUrl.trim() || customUrl.trim() === chatBackground}
              >
                Apply
              </button>
            </form>
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn btn-outline text-xs" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
