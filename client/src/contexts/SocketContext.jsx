import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSocket, connectSocket } from '../services/socket';
import { SOCKET_EVENTS } from '../utils/socketEvents';
import { NOTIFICATION_API } from '../services/api';
import { playNotificationSound, playMessageSound } from '../utils/sound';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [connectionState, setConnectionState] = useState('connecting'); // connecting | connected | reconnecting | offline
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [userStatuses, setUserStatuses] = useState(new Map());
  const [userLastSeen, setUserLastSeen] = useState(new Map());
  const [notifications, setNotifications] = useState([]);

  const unreadNotifCount = notifications.length;

  useEffect(() => {
    if (!token || !user) return undefined;
    const socket = connectSocket(token);

    const onConnect = () => setConnectionState('connected');
    const onDisconnect = () => setConnectionState('reconnecting');
    const onConnectError = () => setConnectionState('offline');
    const onPresenceSync = ({ onlineUserIds: ids }) => {
      const idSet = new Set(ids.map(String));
      setOnlineUserIds(idSet);
      setUserStatuses((prev) => {
        const next = new Map(prev);
        ids.forEach((id) => next.set(String(id), 'online'));
        return next;
      });
    };
    const onUserOnline = ({ userId, status = 'online' }) => {
      const sId = String(userId);
      setOnlineUserIds((prev) => new Set(prev).add(sId));
      setUserStatuses((prev) => new Map(prev).set(sId, status));
    };
    const onUserOffline = ({ userId, lastSeen }) => {
      const sId = String(userId);
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(sId);
        return next;
      });
      setUserStatuses((prev) => {
        const next = new Map(prev);
        next.set(sId, 'offline');
        return next;
      });
      if (lastSeen) {
        setUserLastSeen((prev) => new Map(prev).set(sId, new Date(lastSeen)));
      }
    };
    const onUserStatusChange = ({ userId, status }) => {
      const sId = String(userId);
      setUserStatuses((prev) => new Map(prev).set(sId, status));
      if (status === 'offline') {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          next.delete(sId);
          return next;
        });
      } else {
        setOnlineUserIds((prev) => new Set(prev).add(sId));
      }
    };
    const onNotification = ({ notification }) => {
      setNotifications((prev) => [notification, ...prev.filter((n) => n._id !== notification._id)]);
      if (user?.settings?.notifications?.sound !== false) {
        playNotificationSound();
      }
    };

    const onGlobalMessage = ({ message }) => {
      if (message && String(message.sender?._id || message.sender) !== String(user?._id)) {
        if (user?.settings?.notifications?.sound !== false) {
          playMessageSound();
        }
      }
    };

    const onConversationNotifsCleared = ({ conversationId }) => {
      setNotifications((prev) =>
        prev.filter((n) => {
          const cId = String(n.conversation?._id || n.conversation || '');
          return cId !== String(conversationId);
        })
      );
    };

    socket.on(SOCKET_EVENTS.CONNECT, onConnect);
    socket.on(SOCKET_EVENTS.DISCONNECT, onDisconnect);
    socket.on(SOCKET_EVENTS.CONNECT_ERROR, onConnectError);
    socket.on(SOCKET_EVENTS.PRESENCE_SYNC, onPresenceSync);
    socket.on(SOCKET_EVENTS.USER_ONLINE, onUserOnline);
    socket.on(SOCKET_EVENTS.USER_OFFLINE, onUserOffline);
    socket.on(SOCKET_EVENTS.USER_STATUS_CHANGE, onUserStatusChange);
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, onNotification);
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onGlobalMessage);
    socket.on('notification:conversation-cleared', onConversationNotifsCleared);

    if (socket.connected) setConnectionState('connected');

    NOTIFICATION_API.list()
      .then(({ data }) => {
        // Only keep unread notifications by default so checked ones disappear
        const unreadOnly = (data.data.notifications || []).filter((n) => !n.isRead);
        setNotifications(unreadOnly);
      })
      .catch(() => {});

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, onConnect);
      socket.off(SOCKET_EVENTS.DISCONNECT, onDisconnect);
      socket.off(SOCKET_EVENTS.CONNECT_ERROR, onConnectError);
      socket.off(SOCKET_EVENTS.PRESENCE_SYNC, onPresenceSync);
      socket.off(SOCKET_EVENTS.USER_ONLINE, onUserOnline);
      socket.off(SOCKET_EVENTS.USER_OFFLINE, onUserOffline);
      socket.off(SOCKET_EVENTS.USER_STATUS_CHANGE, onUserStatusChange);
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, onNotification);
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onGlobalMessage);
      socket.off('notification:conversation-cleared', onConversationNotifsCleared);
    };
  }, [token, user]);

  const markNotificationRead = useCallback(async (id) => {
    try {
      await NOTIFICATION_API.markRead(id);
    } catch (e) {
      // ignore
    }
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  }, []);

  const clearConversationNotifications = useCallback(async (conversationId) => {
    if (!conversationId) return;
    setNotifications((prev) =>
      prev.filter((n) => {
        const cId = String(n.conversation?._id || n.conversation || '');
        return cId !== String(conversationId);
      })
    );
    try {
      await NOTIFICATION_API.markConversationRead(conversationId);
    } catch (e) {
      // ignore
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await NOTIFICATION_API.markAllRead();
    } catch (e) {
      // ignore
    }
    setNotifications([]);
  }, []);

  const isOnline = useCallback((userId) => onlineUserIds.has(String(userId)), [onlineUserIds]);
  const getUserStatus = useCallback(
    (userId) => {
      const sId = String(userId);
      if (!onlineUserIds.has(sId)) return 'offline';
      return userStatuses.get(sId) || 'online';
    },
    [onlineUserIds, userStatuses]
  );
  const getLastSeen = useCallback(
    (userId, fallback) => userLastSeen.get(String(userId)) || fallback,
    [userLastSeen]
  );

  return (
    <SocketContext.Provider
      value={{
        socket: getSocket(),
        connectionState,
        onlineUserIds,
        userStatuses,
        isOnline,
        getUserStatus,
        getLastSeen,
        notifications,
        unreadNotifCount,
        markNotificationRead,
        markAllNotificationsRead,
        clearConversationNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocketContext must be used within SocketProvider');
  return ctx;
}
