import { useRef } from 'react';
import { Image, Video, FileText, Music, Paperclip } from 'lucide-react';

const OPTIONS = [
  { key: 'photos', label: 'Photos', icon: Image, accept: 'image/*' },
  { key: 'videos', label: 'Videos', icon: Video, accept: 'video/*' },
  { key: 'documents', label: 'Documents', icon: FileText, accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip' },
  { key: 'audio', label: 'Audio', icon: Music, accept: 'audio/*' },
  { key: 'other', label: 'Other files', icon: Paperclip, accept: '*' },
];

export default function AttachmentMenu({ onFilesSelected, onClose }) {
  const inputRef = useRef(null);

  const trigger = (accept) => {
    if (inputRef.current) {
      inputRef.current.accept = accept;
      inputRef.current.click();
    }
  };

  return (
    <div className="card" style={{ position: 'absolute', bottom: 60, left: 0, padding: 8, width: 190, zIndex: 10 }}>
      {OPTIONS.map(({ key, label, icon: Icon, accept }) => (
        <button
          key={key}
          className="btn-ghost text-sm flex items-center gap-2"
          style={{ width: '100%', justifyContent: 'flex-start', padding: 9 }}
          onClick={() => trigger(accept)}
        >
          <Icon size={15} /> {label}
        </button>
      ))}
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFilesSelected(Array.from(e.target.files));
          e.target.value = '';
          onClose();
        }}
      />
    </div>
  );
}
