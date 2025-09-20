import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import webSocketService from "../services/WebSocketService";
import {
  NEW_MESSAGE_RECEIVED,
  ADD_TYPING_USER,
  REMOVE_TYPING_USER,
} from "../redux/Message/ActionType";

const useWebSocket = () => {
  const dispatch = useDispatch();
  const { auth, chat } = useSelector((store) => store);
  const connectedRef = useRef(false);
  const currentChatSubscriptionRef = useRef(null);

  const handleMessageReceived = useCallback(
    (messageData) => {
      const transformedMessage = {
        id: messageData.id,
        content: messageData.content,
        messageType: messageData.messageType || "TEXT",
        createdAt: messageData.timestamp || new Date().toISOString(),
        sender: {
          id: messageData.senderId,
          username: messageData.senderUsername,
          fullName: messageData.senderUsername,
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

  const handlePresenceUpdate = useCallback((presenceData) => {
    console.log("Presence update:", presenceData);
  }, []);

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
        handlePresenceUpdate
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

  useEffect(() => {
    if (connectedRef.current && chat.activeChat?.id) {
      const chatId = chat.activeChat.id;

      webSocketService.subscribeToChat(chatId, handleMessageReceived);
      currentChatSubscriptionRef.current = chatId;
    } else if (currentChatSubscriptionRef.current) {
      webSocketService.unsubscribeFromChat(currentChatSubscriptionRef.current);
      currentChatSubscriptionRef.current = null;
    } else {
      console.log(
        "Cannot subscribe - connectedRef:",
        connectedRef.current,
        "activeChat:",
        chat.activeChat?.id
      );
    }
  }, [chat.activeChat?.id, connectedRef.current, handleMessageReceived]);

  const sendMessage = useCallback((chatId, content, messageType = "TEXT") => {
    if (!webSocketService.isConnected()) {
      console.warn("WebSocket not connected, cannot send message");
      return false;
    }

    return webSocketService.sendChatMessage(chatId, content, messageType);
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
