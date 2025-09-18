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
  const { auth } = useSelector((store) => store);
  const connectedRef = useRef(false);
  const currentChatSubscriptionRef = useRef(null);

  const handleMessageReceived = useCallback(
    (messageData) => {
      dispatch({
        type: NEW_MESSAGE_RECEIVED,
        payload: messageData,
      });
      if (messageData.sender.id !== auth.user?.id) {
      }
    },
    [dispatch, auth.user?.id]
  );

  const handleTypingUpdate = useCallback(
    (typingData) => {
      if (typingData.typing) {
        dispatch({
          type: ADD_TYPING_USER,
          payload: {
            chatId: typingData.chatId,
            user: typingData.user,
          },
        });
      } else {
        dispatch({
          type: REMOVE_TYPING_USER,
          payload: {
            chatId: typingData.chatId,
            userId: typingData.user.id,
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

  const subscribeToChat = useCallback(
    (chatId) => {
      if (!webSocketService.isConnected()) {
        console.warn("WebSocket not connected, cannot subscribe to chat");
        return;
      }

      if (currentChatSubscriptionRef.current) {
        const previousChatId = currentChatSubscriptionRef.current;
        webSocketService.unsubscribeFromChat(previousChatId);
      }

      const subscription = webSocketService.subscribeToChat(
        chatId,
        handleMessageReceived
      );
      if (subscription) {
        currentChatSubscriptionRef.current = chatId;
      }
    },
    [handleMessageReceived]
  );

  const unsubscribeFromCurrentChat = useCallback(() => {
    if (currentChatSubscriptionRef.current) {
      webSocketService.unsubscribeFromChat(currentChatSubscriptionRef.current);
      currentChatSubscriptionRef.current = null;
    }
  }, []);

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
    subscribeToChat,
    unsubscribeFromCurrentChat,
    sendMessage,
    sendTypingIndicator,
    markMessageAsRead,
    connectionState: webSocketService.getConnectionState(),
  };
};

export default useWebSocket;
