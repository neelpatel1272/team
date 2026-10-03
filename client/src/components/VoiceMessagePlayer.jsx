import { useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { fileUrl } from '../services/api';
import { formatDuration } from '../utils/format';

export default function VoiceMessagePlayer({ attachment, duration }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch((e) => {
        console.warn('Audio play failed:', e);
        setPlaying(false);
      });
    }
  };

  const onTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio?.duration) setProgress((audio.currentTime / audio.duration) * 100);
  };

  return (
    <div className="voice-message">
      <button className="btn-icon" onClick={toggle} style={{ background: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
        {playing ? <Pause size={15} /> : <Play size={15} />}
      </button>
      <div className="voice-message__wave">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            style={{
              height: `${8 + Math.abs(Math.sin(i * 1.3)) * 14}px`,
              opacity: (i / 24) * 100 < progress ? 1 : 0.35,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 11, flexShrink: 0 }}>{formatDuration(duration || 0)}</span>
      <audio
        ref={audioRef}
        src={fileUrl(attachment?.url)}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
    </div>
  );
}
