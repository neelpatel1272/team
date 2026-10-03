// Centralized enums & socket event names shared across the backend.
// The frontend mirrors these in client/src/utils/socketEvents.js — keep both in sync.

const PRESENCE_STATUS = Object.freeze({
  ONLINE: 'online',
  AWAY: 'away',
  BUSY: 'busy',
  DND: 'dnd',
  OFFLINE: 'offline',
});

const MESSAGE_TYPE = Object.freeze({
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  VOICE: 'voice',
  FILE: 'file',
  SYSTEM: 'system',
});

const CONVERSATION_TYPE = Object.freeze({
  DIRECT: 'direct',
  GROUP: 'group',
  TEAM: 'team',
});

const MEMBER_ROLE = Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
});

const CALL_TYPE = Object.freeze({
  AUDIO: 'audio',
  VIDEO: 'video',
});

const CALL_STATUS = Object.freeze({
  RINGING: 'ringing',
  ONGOING: 'ongoing',
  MISSED: 'missed',
  DECLINED: 'declined',
  ENDED: 'ended',
});

const NOTIFICATION_TYPE = Object.freeze({
  MESSAGE: 'message',
  MENTION: 'mention',
  CALL: 'call',
  FILE: 'file',
  GROUP_INVITE: 'group_invite',
  ANNOUNCEMENT: 'announcement',
});

// Socket.IO event names — Socket.IO handles real-time signaling/events only.
// WebRTC media never flows through these; only SDP/ICE payloads do (see call:* below).
const SOCKET_EVENTS = Object.freeze({
  // connection lifecycle
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // presence
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_STATUS_CHANGE: 'user:status-change',
  PRESENCE_SYNC: 'presence:sync',

  // conversations
  CONVERSATION_JOIN: 'conversation:join',
  CONVERSATION_LEAVE: 'conversation:leave',
  CONVERSATION_UPDATED: 'conversation:updated',

  // messages
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_READ: 'message:read',
  MESSAGE_EDIT: 'message:edit',
  MESSAGE_EDITED: 'message:edited',
  MESSAGE_DELETE: 'message:delete',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_REACT: 'message:react',
  MESSAGE_REACTION_UPDATED: 'message:reaction-updated',
  MESSAGE_PIN: 'message:pin',
  MESSAGE_PINNED: 'message:pinned',

  // typing
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // calls (signaling only — media is peer-to-peer via WebRTC)
  CALL_INVITE: 'call:invite',
  CALL_RINGING: 'call:ringing',
  CALL_OFFER: 'call:offer',
  CALL_ANSWER: 'call:answer',
  CALL_ICE_CANDIDATE: 'call:ice-candidate',
  CALL_ACCEPT: 'call:accept',
  CALL_REJECT: 'call:reject',
  CALL_END: 'call:end',
  CALL_BUSY: 'call:busy',
  SCREEN_SHARE_START: 'call:screen-share-start',
  SCREEN_SHARE_STOP: 'call:screen-share-stop',

  // notifications
  NOTIFICATION_NEW: 'notification:new',

  // errors
  SOCKET_ERROR: 'socket:error',
});

module.exports = {
  PRESENCE_STATUS,
  MESSAGE_TYPE,
  CONVERSATION_TYPE,
  MEMBER_ROLE,
  CALL_TYPE,
  CALL_STATUS,
  NOTIFICATION_TYPE,
  SOCKET_EVENTS,
};
