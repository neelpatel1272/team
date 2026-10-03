import { useCallback, useRef, useState } from 'react';
import { SOCKET_EVENTS } from '../utils/socketEvents';
import { CALL_API } from '../services/api';

// Encapsulates one WebRTC peer connection for a 1:1 audio/video call.
// Socket.IO is used ONLY to exchange SDP offers/answers and ICE candidates;
// once connected, audio/video/screen-share flows directly between the two
// browsers over the negotiated peer connection.
export function useWebRTC({ socket, currentUserId }) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const remoteUserIdRef = useRef(null);
  const callIdRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle | ringing | connecting | connected | reconnecting | ended | failed
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const getIceServers = useCallback(async () => {
    try {
      const { data } = await CALL_API.iceServers();
      return data?.data?.iceServers?.length ? data.data.iceServers : [{ urls: 'stun:stun.l.google.com:19302' }];
    } catch {
      return [{ urls: 'stun:stun.l.google.com:19302' }];
    }
  }, []);

  const getLocalMedia = useCallback(async ({ audio = true, video = true }) => {
    if (localStreamRef.current) return localStreamRef.current;
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error('Microphone/camera requires a secure origin (HTTPS or localhost).');
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const createPeerConnection = useCallback(
    async (remoteUserId, callId) => {
      if (pcRef.current) {
        pcRef.current.close();
      }

      const iceServers = await getIceServers();
      const pc = new RTCPeerConnection({ iceServers });
      remoteUserIdRef.current = remoteUserId;
      callIdRef.current = callId;

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE, {
            targetUserId: remoteUserId,
            candidate: event.candidate,
            callId,
          });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setConnectionStatus('connected');
        else if (pc.connectionState === 'disconnected') setConnectionStatus('reconnecting');
        else if (['failed', 'closed'].includes(pc.connectionState)) setConnectionStatus('failed');
      };

      pc.oniceconnectionstatechange = () => {
        if (['connected', 'completed'].includes(pc.iceConnectionState)) setConnectionStatus('connected');
        else if (pc.iceConnectionState === 'disconnected') setConnectionStatus('reconnecting');
        else if (['failed', 'closed'].includes(pc.iceConnectionState)) setConnectionStatus('failed');
      };

      pcRef.current = pc;
      return pc;
    },
    [getIceServers, socket]
  );

  // Caller side: create offer and send it once Callee accepts
  const startCallAsCaller = useCallback(
    async ({ calleeId, callId, type }) => {
      setConnectionStatus('connecting');
      try {
        const stream = await getLocalMedia({ audio: true, video: type === 'video' });
        const pc = await createPeerConnection(calleeId, callId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit(SOCKET_EVENTS.CALL_OFFER, { targetUserId: calleeId, sdp: offer, callId });
      } catch (err) {
        console.error('[webrtc] startCallAsCaller error:', err);
        setConnectionStatus('failed');
        throw err;
      }
    },
    [createPeerConnection, getLocalMedia, socket]
  );

  // Callee side: initialize local media and create peer connection when Accept is clicked
  const prepareToAnswer = useCallback(
    async ({ callerId, callId, type }) => {
      setConnectionStatus('connecting');
      try {
        const stream = await getLocalMedia({ audio: true, video: type === 'video' });
        const pc = await createPeerConnection(callerId, callId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        return pc;
      } catch (err) {
        console.error('[webrtc] prepareToAnswer error:', err);
        setConnectionStatus('failed');
        throw err;
      }
    },
    [createPeerConnection, getLocalMedia]
  );

  // Callee side: receive caller's offer, set remote description, and send answer
  const handleOffer = useCallback(
    async ({ fromUserId, sdp, callId }) => {
      try {
        let pc = pcRef.current;
        if (!pc) {
          pc = await createPeerConnection(fromUserId, callId);
        }
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        // Flush any ICE candidates that arrived before the remote description was set
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit(SOCKET_EVENTS.CALL_ANSWER, { targetUserId: fromUserId, sdp: answer, callId });
      } catch (err) {
        console.error('[webrtc] handleOffer error:', err);
        setConnectionStatus('failed');
      }
    },
    [createPeerConnection, socket]
  );

  // Caller side: receive callee's answer
  const handleAnswer = useCallback(async ({ sdp }) => {
    try {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));

      // Flush any queued ICE candidates
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
      pendingCandidatesRef.current = [];
    } catch (err) {
      console.error('[webrtc] handleAnswer error:', err);
    }
  }, []);

  const handleRemoteIceCandidate = useCallback(async ({ candidate }) => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) {
      pendingCandidatesRef.current.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[webrtc] Failed to add ICE candidate', err);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return false;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return false;
    audioTrack.enabled = !audioTrack.enabled;
    return !audioTrack.enabled; // returns isMuted
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return false;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return false;
    videoTrack.enabled = !videoTrack.enabled;
    return !videoTrack.enabled; // returns isCameraOff
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      const pc = pcRef.current;
      const sender = pc?.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) await sender.replaceTrack(screenTrack);

      setIsScreenSharing(true);
      if (remoteUserIdRef.current) {
        socket.emit(SOCKET_EVENTS.SCREEN_SHARE_START, { targetUserId: remoteUserIdRef.current, callId: callIdRef.current });
      }

      screenTrack.onended = () => stopScreenShare();
      return screenStream;
    } catch (err) {
      console.warn('[webrtc] startScreenShare error:', err);
    }
  }, [socket]);

  const stopScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    const sender = pc?.getSenders().find((s) => s.track && s.track.kind === 'video');
    if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);

    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);

    if (remoteUserIdRef.current) {
      socket.emit(SOCKET_EVENTS.SCREEN_SHARE_STOP, { targetUserId: remoteUserIdRef.current, callId: callIdRef.current });
    }
  }, [socket]);

  const endCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();

    pcRef.current = null;
    localStreamRef.current = null;
    screenStreamRef.current = null;
    remoteUserIdRef.current = null;
    callIdRef.current = null;
    pendingCandidatesRef.current = [];

    setLocalStream(null);
    setRemoteStream(null);
    setIsScreenSharing(false);
    setConnectionStatus('ended');
  }, []);

  return {
    localStream,
    remoteStream,
    connectionStatus,
    setConnectionStatus,
    isScreenSharing,
    getLocalMedia,
    startCallAsCaller,
    prepareToAnswer,
    handleOffer,
    handleAnswer,
    handleRemoteIceCandidate,
    toggleMute,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    endCall,
  };
}
