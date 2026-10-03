import { useEffect, useRef, useState } from 'react';
import { Paperclip, Send, Mic, Square, Trash2, X, Smile } from 'lucide-react';
import AttachmentMenu from './AttachmentMenu';
import { FILE_API } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { categoryFromMime, messageTypeFromAttachments } from '../utils/fileCategory';
import { formatBytes, formatDuration } from '../utils/format';
import { REACTION_EMOJIS } from '../utils/socketEvents';

const TYPING_DEBOUNCE_MS = 2000;
const MAX_FILE_MB = 25;

export default function MessageComposer({ conversationId, replyTo, onCancelReply, onSend, onTypingStart, onTypingStop }) {
  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]); // { file, progress, error }
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    setText('');
    setPendingFiles([]);
  }, [conversationId]);

  useEffect(() => {
    if (replyTo && textareaRef.current) textareaRef.current.focus();
  }, [replyTo]);

  const handleTyping = () => {
    onTypingStart?.();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTypingStop?.(), TYPING_DEBOUNCE_MS);
  };

  const addFiles = (files) => {
    const valid = [];
    for (const file of files) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        showToast(`"${file.name}" is larger than ${MAX_FILE_MB}MB.`, 'error');
        continue;
      }
      valid.push({ file, progress: 0, uploaded: null, error: null });
    }
    setPendingFiles((prev) => [...prev, ...valid]);
  };

  const removePendingFile = (idx) => setPendingFiles((prev) => prev.filter((_, i) => i !== idx));

  const uploadAll = async () => {
    const uploaded = [];
    for (let i = 0; i < pendingFiles.length; i++) {
      const { file } = pendingFiles[i];
      const formData = new FormData();
      formData.append('files', file);
      formData.append('conversationId', conversationId);
      try {
        const { data } = await FILE_API.upload(formData, (pct) => {
          setPendingFiles((prev) => prev.map((p, idx) => (idx === i ? { ...p, progress: pct } : p)));
        });
        uploaded.push(...data.data.attachments);
      } catch (err) {
        showToast(`Failed to upload "${file.name}". Please try again.`, 'error');
        throw err;
      }
    }
    return uploaded;
  };

  const handleSend = async () => {
    if (!text.trim() && pendingFiles.length === 0) return;

    let attachments = [];
    if (pendingFiles.length > 0) {
      try {
        attachments = await uploadAll();
      } catch {
        return; // toast already shown
      }
    }

    const messageType = attachments.length > 0 ? messageTypeFromAttachments(attachments) : 'text';

    onSend({
      content: text.trim(),
      messageType,
      attachmentIds: attachments.map((a) => a._id),
      replyTo: replyTo?._id || null,
    });

    setText('');
    setPendingFiles([]);
    onTypingStop?.();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Voice recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && recordedChunksRef.current.push(e.data);
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch (err) {
      showToast('Microphone permission is required.', 'error');
    }
  };

  const stopRecording = (send) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    clearInterval(recordTimerRef.current);
    setIsRecording(false);

    recorder.onstop = async () => {
      recorder.stream.getTracks().forEach((t) => t.stop());
      if (!send) return;

      const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('files', file);
      formData.append('conversationId', conversationId);

      try {
        const { data } = await FILE_API.upload(formData);
        onSend({
          content: '',
          messageType: 'voice',
          attachmentIds: [data.data.attachments[0]._id],
          voiceDuration: recordSeconds,
          replyTo: replyTo?._id || null,
        });
      } catch {
        showToast('Unable to send voice message. Please try again.', 'error');
      }
    };
    recorder.stop();
  };

  return (
    <div
      className="composer"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(Array.from(e.dataTransfer.files || []));
      }}
      style={{ background: isDragging ? 'var(--color-surface-alt)' : undefined }}
    >
      {replyTo && (
        <div className="composer__reply-preview">
          <div>
            Replying to <b>{replyTo.sender.firstName}</b>: {replyTo.content?.slice(0, 70) || 'Attachment'}
          </div>
          <button className="btn-icon" style={{ width: 24, height: 24 }} onClick={onCancelReply}><X size={14} /></button>
        </div>
      )}

      {pendingFiles.length > 0 && (
        <div className="flex-col gap-2" style={{ marginBottom: 8 }}>
          {pendingFiles.map((pf, i) => (
            <div key={i} className="file-card">
              <div className="file-card__icon">{categoryFromMime(pf.file.type) === 'image' ? '🖼️' : '📎'}</div>
              <div className="file-card__body">
                <div className="file-card__name">{pf.file.name}</div>
                <div className="file-card__meta">{formatBytes(pf.file.size)}</div>
                {pf.progress > 0 && pf.progress < 100 && (
                  <div className="upload-progress"><div className="upload-progress__bar" style={{ width: `${pf.progress}%` }} /></div>
                )}
              </div>
              <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => removePendingFile(i)}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {isRecording ? (
        <div className="flex items-center gap-3" style={{ padding: '6px 4px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-danger)', animation: 'pulse 1s infinite' }} />
          <span className="text-sm font-bold">Recording... {formatDuration(recordSeconds)}</span>
          <div style={{ flex: 1 }} />
          <button className="btn btn-outline" onClick={() => stopRecording(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={() => stopRecording(true)}><Square size={14} /> Send</button>
        </div>
      ) : (
        <div className="composer__row" style={{ position: 'relative' }}>
          <button className="btn-icon" onClick={() => setMenuOpen((o) => !o)}><Paperclip size={18} /></button>
          {menuOpen && <AttachmentMenu onFilesSelected={addFiles} onClose={() => setMenuOpen(false)} />}

          <textarea
            ref={textareaRef}
            className="composer__textarea"
            placeholder="Type a message..."
            rows={1}
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping(); }}
            onKeyDown={onKeyDown}
          />

          <div style={{ position: 'relative' }}>
            <button className="btn-icon" onClick={() => setEmojiOpen((o) => !o)}><Smile size={18} /></button>
            {emojiOpen && (
              <div className="card flex gap-1" style={{ position: 'absolute', bottom: 46, right: 0, padding: 6 }}>
                {REACTION_EMOJIS.map((e) => (
                  <button key={e} className="btn-ghost" style={{ fontSize: 16, padding: 4 }} onClick={() => { setText((t) => t + e); setEmojiOpen(false); }}>{e}</button>
                ))}
              </div>
            )}
          </div>

          {text.trim() || pendingFiles.length > 0 ? (
            <button className="btn btn-primary btn-icon" onClick={handleSend}><Send size={17} /></button>
          ) : (
            <button className="btn-icon" onClick={startRecording}><Mic size={18} /></button>
          )}
        </div>
      )}
    </div>
  );
}
