// Mirrors server/config/constants.js SOCKET_EVENTS + enums.
// Keep in sync manually — small, stable list.

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_STATUS_CHANGE: 'user:status-change',
  PRESENCE_SYNC: 'presence:sync',

  CONVERSATION_JOIN: 'conversation:join',
  CONVERSATION_LEAVE: 'conversation:leave',
  CONVERSATION_UPDATED: 'conversation:updated',

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

  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

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

  NOTIFICATION_NEW: 'notification:new',
  SOCKET_ERROR: 'socket:error',
};

export const PRESENCE_STATUS = {
  ONLINE: 'online',
  AWAY: 'away',
  BUSY: 'busy',
  DND: 'dnd',
  OFFLINE: 'offline',
};

export const MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  VOICE: 'voice',
  FILE: 'file',
  SYSTEM: 'system',
};

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '😮', '👎'];
