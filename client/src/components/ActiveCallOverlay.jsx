import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, MonitorX, Volume2 } from 'lucide-react';
import { useCall } from '../contexts/CallContext';
import UserAvatar from './UserAvatar';
import { formatDuration } from '../utils/format';

export default function ActiveCallOverlay() {
  const { activeCall, callError, webrtc, hangUp } = useCall();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [seconds, setSeconds] = useState(0);

  const { localStream, remoteStream, connectionStatus, isScreenSharing, toggleMute, toggleCamera, startScreenShare, stopScreenShare } = webrtc;

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (connectionStatus !== 'connected') return undefined;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [connectionStatus]);

  if (!activeCall) return null;

  const isVideo = activeCall.type === 'video';

  const statusLabel =
    callError ||
    {
      ringing: 'Calling...',
      connecting: 'Connecting...',
      connected: formatDuration(seconds),
      reconnecting: 'Reconnecting...',
      failed: 'Connection failed',
      ended: 'Call ended',
    }[connectionStatus] ||
    (activeCall.status === 'ringing' ? 'Calling...' : 'Connecting...');

  return (
    <div className="call-overlay">
      {isVideo && remoteStream ? (
        <video ref={remoteVideoRef} className="call-overlay__remote-video" autoPlay playsInline />
      ) : (
        <div className="flex-col items-center gap-3" style={{ zIndex: 1 }}>
          <UserAvatar user={{ firstName: activeCall.peer.name?.split(' ')[0], lastName: activeCall.peer.name?.split(' ')[1], profileImage: activeCall.peer.profileImage }} size={120} />
        </div>
      )}

      {!isVideo && <audio ref={remoteAudioRef} autoPlay />}

      <div style={{ position: 'absolute', top: 40, textAlign: 'center', zIndex: 2 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{activeCall.peer.name}</div>
        <div className="muted text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
          {statusLabel}
          {isScreenSharing && ' · Sharing your screen'}
        </div>
      </div>

      {isVideo && localStream && (
        <video ref={localVideoRef} className="call-overlay__local-video" autoPlay playsInline muted />
      )}

      <div className="call-overlay__controls">
        <button
          className={`call-btn ${muted ? 'active' : ''}`}
          onClick={() => setMuted(toggleMute())}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {isVideo && (
          <button
            className={`call-btn ${cameraOff ? 'active' : ''}`}
            onClick={() => setCameraOff(toggleCamera())}
            title={cameraOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        )}

        {isVideo && (
          <button
            className={`call-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={() => (isScreenSharing ? stopScreenShare() : startScreenShare())}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {isScreenSharing ? <MonitorX size={20} /> : <MonitorUp size={20} />}
          </button>
        )}

        {!isVideo && (
          <button
            className={`call-btn ${speakerOn ? 'active' : ''}`}
            onClick={() => setSpeakerOn((s) => !s)}
            title="Speaker"
          >
            <Volume2 size={20} />
          </button>
        )}

        <button className="call-btn danger" onClick={hangUp} title="End call">
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}
