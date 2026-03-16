import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import webSocketService from "../services/WebSocketService";
import {
  NEW_MESSAGE_RECEIVED,
  ADD_TYPING_USER,
  REMOVE_TYPING_USER,
} from "../redux/Message/ActionType";
import { INCREMENT_UNREAD_COUNT, UPDATE_CHAT_LAST_MESSAGE } from "../redux/Chat/ActionType";

const useWebSocket = () => {
  const dispatch = useDispatch();
  const { auth, chat } = useSelector((store) => store);
  const connectedRef = useRef(false);
  const currentChatSubscriptionRef = useRef(null);
  const activeChatIdRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const lastProcessedMsgIdRef = useRef(null);

  useEffect(() => {
    activeChatIdRef.current = chat?.activeChat?.id || null;
  }, [chat?.activeChat?.id]);

  useEffect(() => {
    currentUserIdRef.current = auth?.user?.id || null;
  }, [auth?.user?.id]);

  const handleMessageReceived = useCallback(
    (messageData) => {
      if (messageData.id === lastProcessedMsgIdRef.current) {
        return;
      }
      lastProcessedMsgIdRef.current = messageData.id;

      const transformedMessage = {
        id: messageData.id,
        content: messageData.content,
        messageType: messageData.messageType || "TEXT",
        createdAt: messageData.timestamp || new Date().toISOString(),
        clientMessageId: messageData.clientMessageId || null,
        sender: {
          id: messageData.senderId,
          username: messageData.senderUsername,
          fullName: messageData.senderFullName,
          urlAvatar: messageData.senderAvatar,
        },
        chat: {
          id: messageData.chatId,
        },
      };

      dispatch({
        type: NEW_MESSAGE_RECEIVED,
        payload: transformedMessage,
      });

      dispatch({
        type: UPDATE_CHAT_LAST_MESSAGE,
        payload: {
          chatId: messageData.chatId,
          lastMessage: {
            id: messageData.id,
            content: messageData.content,
            messageType: messageData.messageType || "TEXT",
            createdAt: messageData.timestamp || new Date().toISOString(),
            senderId: messageData.senderId,
            senderName: messageData.senderFullName || messageData.senderUsername,
          },
        },
      });

      if (
        messageData.chatId !== activeChatIdRef.current &&
        messageData.senderId !== currentUserIdRef.current
      ) {
        dispatch({
          type: INCREMENT_UNREAD_COUNT,
          payload: messageData.chatId,
        });
      }
    },
    [dispatch]
  );

  const handleTypingUpdate = useCallback(
    (typingData) => {
      if (typingData.status === "TYPING") {
        dispatch({
          type: ADD_TYPING_USER,
          payload: {
            chatId: typingData.chatId,
            user: { id: typingData.userId, fullName: typingData.username },
          },
        });
      } else {
        dispatch({
          type: REMOVE_TYPING_USER,
          payload: {
            chatId: typingData.chatId,
            userId: typingData.userId,
          },
        });
      }
    },
    [dispatch]
  );

  const handlePresenceUpdate = useCallback((presenceData) => {}, []);

  const connect = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (connectedRef.current || !auth.user || !auth.jwt) {
      return;
    }

    try {
      await webSocketService.connect(
        token,
        handleMessageReceived,
        handleTypingUpdate,
        handlePresenceUpdate,
        auth.user.id
      );
      connectedRef.current = true;
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      connectedRef.current = false;
    }
  }, [
    auth.user,
    auth.jwt,
    handleMessageReceived,
    handleTypingUpdate,
    handlePresenceUpdate,
  ]);

  const disconnect = useCallback(() => {
    if (connectedRef.current) {
      webSocketService.disconnect();
      connectedRef.current = false;
    }
  }, []);


  const sendMessage = useCallback((chatId, content, messageType = "TEXT", clientMessageId) => {
    if (!webSocketService.isConnected()) {
      console.warn("WebSocket not connected, cannot send message");
      return false;
    }
    return webSocketService.sendChatMessage(chatId, content, messageType, clientMessageId);
  }, []);

  const sendTypingIndicator = useCallback((chatId, isTyping) => {
    if (!webSocketService.isConnected()) {
      return false;
    }
    return webSocketService.sendTypingIndicator(chatId, isTyping);
  }, []);

  const markMessageAsRead = useCallback((messageId) => {
    if (!webSocketService.isConnected()) {
      return false;
    }
    return webSocketService.markMessageAsRead(messageId);
  }, []);

  useEffect(() => {
    if (auth.user && auth.jwt && !connectedRef.current) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [auth.user, auth.jwt, connect, disconnect]);

  useEffect(() => {
    if (!auth.user && connectedRef.current) {
      disconnect();
    }
  }, [auth.user, disconnect]);

  return {
    isConnected: connectedRef.current,
    connect,
    disconnect,
    sendMessage,
    sendTypingIndicator,
    markMessageAsRead,
    connectionState: webSocketService.getConnectionState(),
  };
};

export default useWebSocket;