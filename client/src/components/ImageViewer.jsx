import { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { fileUrl } from '../services/api';

export default function ImageViewer({ images, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!images?.length) return null;
  const current = images[index];

  const next = () => { setZoom(1); setIndex((i) => (i + 1) % images.length); };
  const prev = () => { setZoom(1); setIndex((i) => (i - 1 + images.length) % images.length); };

  return (
    <div className="overlay" style={{ background: 'rgba(0,0,0,0.9)' }} onClick={onClose}>
      <div
        style={{ position: 'absolute', top: 18, right: 18, display: 'flex', gap: 8, zIndex: 2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }} onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}>
          <ZoomIn size={18} />
        </button>
        <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }} onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}>
          <ZoomOut size={18} />
        </button>
        <a href={fileUrl(current.url)} download className="btn-icon" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
          <Download size={18} />
        </a>
        <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }} onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {images.length > 1 && (
        <button
          className="btn-icon"
          style={{ position: 'absolute', left: 18, top: '50%', background: 'rgba(255,255,255,0.12)', color: '#fff' }}
          onClick={(e) => { e.stopPropagation(); prev(); }}
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <img
        src={fileUrl(current.url)}
        alt={current.originalName}
        style={{ maxWidth: '85vw', maxHeight: '85vh', transform: `scale(${zoom})`, transition: 'transform 150ms ease' }}
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button
          className="btn-icon"
          style={{ position: 'absolute', right: 18, top: '50%', background: 'rgba(255,255,255,0.12)', color: '#fff' }}
          onClick={(e) => { e.stopPropagation(); next(); }}
        >
          <ChevronRight size={22} />
        </button>
      )}
    </div>
  );
}
