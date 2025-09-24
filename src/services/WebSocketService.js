import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

class WebSocketService {
  getWebSocketUrl(token) {
  const wsUrl = import.meta.env.VITE_WS_URL;
  if (wsUrl) {
    return `${wsUrl}?token=${token}`;
  }
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  
  if (apiUrl.includes('ngrok') || apiUrl.includes('trycloudflare.com')) {
    return `${apiUrl}/ws?token=${token}`;
  }
  
  const convertedWsUrl = apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');
  return `${convertedWsUrl}/ws?token=${token}`;
}
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.currentChatId = null;
  }

  connect(token, onMessageReceived, onTypingUpdate, onPresenceUpdate) {
  return new Promise((resolve, reject) => {
    try {
      const wsUrl = this.getWebSocketUrl(token);
      console.log('Connecting to WebSocket:', wsUrl);

      this.client = new Client({
        webSocketFactory: () => {
          const sockJSOptions = {};
          if (wsUrl.includes('ngrok')) {
            sockJSOptions.headers = {
              "ngrok-skip-browser-warning": "true"
            };
          }
          return new SockJS(wsUrl, null, sockJSOptions);
        },

        connectHeaders: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },

        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: (frame) => {
          this.connected = true;
          this.reconnectAttempts = 0;
          console.log('WebSocket connected successfully');

          setTimeout(() => {
            this.setupSubscriptions(
              onMessageReceived,
              onTypingUpdate,
              onPresenceUpdate
            );
          }, 100);

          resolve(frame);
        },

        onStompError: (frame) => {
          console.error("STOMP Error:", frame);
          this.connected = false;
          reject(new Error(frame.headers["message"]));
        },

        onWebSocketClose: (event) => {
          console.log('WebSocket connection closed');
          this.connected = false;
          this.handleReconnect(
            token,
            onMessageReceived,
            onTypingUpdate,
            onPresenceUpdate
          );
        },

        onWebSocketError: (error) => {
          console.error("WebSocket Error:", error);
          this.connected = false;
          reject(error);
        },
      });

      this.client.activate();
    } catch (error) {
      console.error("WebSocket Connection Error:", error);
      reject(error);
    }
  });
}

  setupSubscriptions(onMessageReceived, onTypingUpdate, onPresenceUpdate) {
    if (!this.client || !this.connected) {
      console.warn("Cannot setup subscriptions - client not ready");
      return;
    }

    try {
      const personalSubscription = this.client.subscribe(
        "/user/queue/messages",
        (message) => {
          try {
            const messageData = JSON.parse(message.body);
            onMessageReceived(messageData);
          } catch (error) {
            console.error("Error parsing personal message:", error);
          }
        }
      );

      const typingSubscription = this.client.subscribe(
        "/user/queue/typing",
        (message) => {
          try {
            const typingData = JSON.parse(message.body);
            onTypingUpdate(typingData);
          } catch (error) {
            console.error("Error parsing typing message:", error);
          }
        }
      );

      const presenceSubscription = this.client.subscribe(
        "/topic/presence",
        (message) => {
          try {
            const presenceData = JSON.parse(message.body);
            onPresenceUpdate(presenceData);
          } catch (error) {
            console.error("Error parsing presence message:", error);
          }
        }
      );

      this.subscriptions.set("personal", personalSubscription);
      this.subscriptions.set("typing", typingSubscription);
      this.subscriptions.set("presence", presenceSubscription);
    } catch (error) {
      console.error("Error setting up subscriptions:", error);
      setTimeout(() => {
        this.setupSubscriptions(
          onMessageReceived,
          onTypingUpdate,
          onPresenceUpdate
        );
      }, 500);
    }
  }

  subscribeToChat(chatId, onChatMessage) {
    if (!this.client || !this.connected) {
      console.warn("WebSocket not connected");
      return null;
    }

    if (this.currentChatId && this.currentChatId !== chatId) {
      this.unsubscribeFromChat(this.currentChatId);
    }

    this.currentChatId = chatId;
    const destination = `/topic/chat/${chatId}`;

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const messageData = JSON.parse(message.body);
        onChatMessage(messageData);
      } catch (error) {
        console.error("Error parsing chat message:", error);
      }
    });

    this.subscriptions.set(`chat-${chatId}`, subscription);
    return subscription;
  }

  unsubscribeFromChat(chatId) {
    const subscription = this.subscriptions.get(`chat-${chatId}`);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(`chat-${chatId}`);
    }
    if (this.currentChatId === chatId) {
      this.currentChatId = null;
    }
  }

  sendMessage(destination, message) {
    if (!this.client || !this.connected) {
      console.warn("WebSocket not connected");
      return false;
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(message),
      });
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }

  sendChatMessage(chatId, content, messageType = "TEXT") {
    const token = localStorage.getItem("token");
    return this.sendMessage("/app/message.send", {
      chatId,
      content,
      messageType,
      token: token,
    });
  }

  sendTypingIndicator(chatId, isTyping) {
    const endpoint = isTyping ? "/app/typing.start" : "/app/typing.stop";
    return this.sendMessage(endpoint, { chatId });
  }

  markMessageAsRead(messageId) {
    const token = localStorage.getItem("token");
    return this.sendMessage("/app/message.read", {
      messageId: messageId,
      token: token,
    });
  }

  handleReconnect(token, onMessageReceived, onTypingUpdate, onPresenceUpdate) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;

    setTimeout(() => {
      this.connect(
        token,
        onMessageReceived,
        onTypingUpdate,
        onPresenceUpdate
      ).catch((error) => {
        console.error("Reconnection failed:", error);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.forEach((subscription, key) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      this.currentChatId = null;

      this.client.deactivate();
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }

  getConnectionState() {
    if (!this.client) return "DISCONNECTED";
    return this.client.state;
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
