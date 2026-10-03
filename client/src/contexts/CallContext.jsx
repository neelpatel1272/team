import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocketContext } from './SocketContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { SOCKET_EVENTS } from '../utils/socketEvents';
import { startRingtone, stopRingtone } from '../utils/sound';

const CallContext = createContext(null);

export function CallProvider({ children }) {
  const { user } = useAuth();
  const { socket } = useSocketContext();
  const webrtc = useWebRTC({ socket, currentUserId: user?._id });

  // incomingCall: { callId, type, conversationId, caller }
  const [incomingCall, setIncomingCall] = useState(null);
  // activeCall: { callId, type, peer: { id, name, profileImage }, direction, status }
  const [activeCall, setActiveCall] = useState(null);
  const [callError, setCallError] = useState(null);

  const activeCallRef = useRef(null);
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    if (!socket) return undefined;

    const onRinging = ({ callId, type, conversationId, caller }) => {
      // If already on a call, silently ignore
      if (activeCallRef.current) return;
      setIncomingCall({ callId, type, conversationId, caller });
      startRingtone();
    };

    const onOffer = async (payload) => {
      await webrtc.handleOffer(payload);
    };

    const onAnswer = async (payload) => {
      await webrtc.handleAnswer(payload);
    };

    const onIceCandidate = async (payload) => {
      await webrtc.handleRemoteIceCandidate(payload);
    };

    // Caller receives CALL_ACCEPT once Callee clicks accept
    const onAccept = async ({ callId, calleeId }) => {
      stopRingtone();
      setActiveCall((prev) => (prev ? { ...prev, status: 'connecting' } : prev));
      const targetId = calleeId || activeCallRef.current?.peer?.id;
      const targetCallId = callId || activeCallRef.current?.callId;
      const callType = activeCallRef.current?.type || 'audio';
      if (targetId && targetCallId) {
        try {
          await webrtc.startCallAsCaller({ calleeId: targetId, callId: targetCallId, type: callType });
        } catch (err) {
          setCallError(err.message || 'Failed to start media stream.');
        }
      }
    };

    const onReject = () => {
      stopRingtone();
      setCallError('Call declined.');
      webrtc.endCall();
      setActiveCall(null);
    };

    const onEnd = () => {
      stopRingtone();
      webrtc.endCall();
      setActiveCall(null);
      setIncomingCall(null);
    };

    const onBusy = ({ reason }) => {
      stopRingtone();
      setCallError(reason === 'offline' ? 'That teammate is currently offline.' : 'Teammate is busy.');
      webrtc.endCall();
      setActiveCall(null);
    };

    socket.on(SOCKET_EVENTS.CALL_RINGING, onRinging);
    socket.on(SOCKET_EVENTS.CALL_OFFER, onOffer);
    socket.on(SOCKET_EVENTS.CALL_ANSWER, onAnswer);
    socket.on(SOCKET_EVENTS.CALL_ICE_CANDIDATE, onIceCandidate);
    socket.on(SOCKET_EVENTS.CALL_ACCEPT, onAccept);
    socket.on(SOCKET_EVENTS.CALL_REJECT, onReject);
    socket.on(SOCKET_EVENTS.CALL_END, onEnd);
    socket.on(SOCKET_EVENTS.CALL_BUSY, onBusy);

    return () => {
      stopRingtone();
      socket.off(SOCKET_EVENTS.CALL_RINGING, onRinging);
      socket.off(SOCKET_EVENTS.CALL_OFFER, onOffer);
      socket.off(SOCKET_EVENTS.CALL_ANSWER, onAnswer);
      socket.off(SOCKET_EVENTS.CALL_ICE_CANDIDATE, onIceCandidate);
      socket.off(SOCKET_EVENTS.CALL_ACCEPT, onAccept);
      socket.off(SOCKET_EVENTS.CALL_REJECT, onReject);
      socket.off(SOCKET_EVENTS.CALL_END, onEnd);
      socket.off(SOCKET_EVENTS.CALL_BUSY, onBusy);
    };
  }, [socket, webrtc]);

  const placeCall = useCallback(
    async ({ calleeId, calleeName, calleeImage, type, conversationId }) => {
      setCallError(null);
      try {
        // Pre-fetch local media immediately so permissions are checked and local video previews
        await webrtc.getLocalMedia({ audio: true, video: type === 'video' });
      } catch (err) {
        setCallError(err.message || 'Camera / microphone access denied.');
        return;
      }

      const localCallId = `pending-${Date.now()}`;
      setActiveCall({
        callId: localCallId,
        type,
        direction: 'outgoing',
        status: 'ringing',
        peer: { id: calleeId, name: calleeName, profileImage: calleeImage },
      });

      socket.emit(SOCKET_EVENTS.CALL_INVITE, { calleeId, type, conversationId }, (ack) => {
        if (!ack?.success) {
          setCallError(ack?.reason === 'offline' ? 'That teammate is currently offline.' : 'Call failed to initiate.');
          webrtc.endCall();
          setActiveCall(null);
          return;
        }
        if (ack?.callId) {
          setActiveCall((prev) => (prev ? { ...prev, callId: ack.callId } : prev));
        }
      });
    },
    [socket, webrtc]
  );

  const acceptCall = useCallback(async () => {
    stopRingtone();
    if (!incomingCall) return;
    const { callId, type, caller } = incomingCall;
    setCallError(null);
    setActiveCall({
      callId,
      type,
      direction: 'incoming',
      status: 'connecting',
      peer: { id: caller.id, name: caller.name, profileImage: caller.profileImage },
    });
    setIncomingCall(null);

    try {
      await webrtc.prepareToAnswer({ callerId: caller.id, callId, type });
      socket.emit(SOCKET_EVENTS.CALL_ACCEPT, { callId, callerId: caller.id });
    } catch (err) {
      setCallError(err.message || 'Camera / microphone access denied.');
      socket.emit(SOCKET_EVENTS.CALL_REJECT, { callId, callerId: caller.id });
      webrtc.endCall();
      setActiveCall(null);
    }
  }, [incomingCall, socket, webrtc]);

  const declineCall = useCallback(() => {
    stopRingtone();
    if (!incomingCall) return;
    socket.emit(SOCKET_EVENTS.CALL_REJECT, { callId: incomingCall.callId, callerId: incomingCall.caller.id });
    setIncomingCall(null);
  }, [incomingCall, socket]);

  const hangUp = useCallback(() => {
    stopRingtone();
    if (activeCall?.callId && activeCall?.peer?.id && socket) {
      socket.emit(SOCKET_EVENTS.CALL_END, { callId: activeCall.callId, otherUserId: activeCall.peer.id });
    }
    webrtc.endCall();
    setActiveCall(null);
    setIncomingCall(null);
  }, [activeCall, socket, webrtc]);

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        activeCall,
        callError,
        setCallError,
        webrtc,
        placeCall,
        acceptCall,
        declineCall,
        hangUp,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
}
