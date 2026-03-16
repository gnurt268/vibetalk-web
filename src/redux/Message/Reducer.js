import {
  SEND_MESSAGE,
  SEND_MESSAGE_SUCCESS,
  SEND_MESSAGE_ERROR,
  GET_CHAT_MESSAGES,
  GET_CHAT_MESSAGES_SUCCESS,
  GET_CHAT_MESSAGES_ERROR,
  GET_MESSAGES_SINCE_SUCCESS,
  DELETE_MESSAGE_SUCCESS,
  DELETE_MESSAGE_FOR_ME_SUCCESS,
  SET_MESSAGE_LOADING,
  CLEAR_MESSAGE_ERROR,
  SET_MESSAGE_DRAFT,
  CLEAR_MESSAGE_DRAFT,
  NEW_MESSAGE_RECEIVED,
  MESSAGE_UPDATED,
  MESSAGE_DELETED,
  ADD_TYPING_USER,
  REMOVE_TYPING_USER,
  UPLOAD_FILE,
  UPLOAD_FILE_SUCCESS,
  UPLOAD_FILE_ERROR,
  ADD_OPTIMISTIC_MESSAGE,
  MARK_MESSAGE_FAILED,
  SET_REPLYING_TO,
  CLEAR_REPLYING_TO,
} from "./ActionType";

const initialState = {
  messagesByChat: {},
  activeMessage: null,
  loading: false,
  messageLoading: false,
  sendingMessage: false,
  uploadingFile: false,
  uploadProgress: 0,
  replyingTo: null,
  error: null,
  searchResults: {},
  messageCounts: {},
  typingUsers: {},
  messageDrafts: {},
};

const messageReducer = (state = initialState, action) => {
  switch (action.type) {
    // ===== OPTIMISTIC UI =====

    case ADD_OPTIMISTIC_MESSAGE: {
      const optimisticMsg = action.payload;
      const optChatId = optimisticMsg.chat?.id;
      if (!optChatId) return state;

      const optExisting = state.messagesByChat[optChatId]?.messages || [];

      return {
        ...state,
        messagesByChat: {
          ...state.messagesByChat,
          [optChatId]: {
            ...state.messagesByChat[optChatId],
            messages: [...optExisting, optimisticMsg],
          },
        },
        messageDrafts: {
          ...state.messageDrafts,
          [optChatId]: "",
        },
      };
    }

    case MARK_MESSAGE_FAILED: {
      const { clientMessageId: failedCmid, chatId: failedChatId } = action.payload;
      const failedMessages = state.messagesByChat[failedChatId]?.messages || [];

      return {
        ...state,
        messagesByChat: {
          ...state.messagesByChat,
          [failedChatId]: {
            ...state.messagesByChat[failedChatId],
            messages: failedMessages.map((m) =>
              m.clientMessageId === failedCmid
                ? { ...m, status: "FAILED" }
                : m
            ),
          },
        },
      };
    }

    case NEW_MESSAGE_RECEIVED: {
      const receivedMessage = action.payload;
      const receivedChatId = receivedMessage.chat?.id;
      if (!receivedChatId) return state;

      const currentMessages = state.messagesByChat[receivedChatId]?.messages || [];

      // Dedup by server id
      if (receivedMessage.id && currentMessages.some((m) => m.id === receivedMessage.id)) {
        return state;
      }

      // Replace optimistic message by clientMessageId
      if (receivedMessage.clientMessageId) {
        const optimisticIndex = currentMessages.findIndex(
          (m) => m.clientMessageId === receivedMessage.clientMessageId
        );
        if (optimisticIndex >= 0) {
          const updatedMessages = [...currentMessages];
          updatedMessages[optimisticIndex] = {
            ...receivedMessage,
            status: "DELIVERED",
          };
          return {
            ...state,
            messagesByChat: {
              ...state.messagesByChat,
              [receivedChatId]: {
                ...state.messagesByChat[receivedChatId],
                messages: updatedMessages,
              },
            },
          };
        }
      }

      // New message from other user
      return {
        ...state,
        messagesByChat: {
          ...state.messagesByChat,
          [receivedChatId]: {
            ...state.messagesByChat[receivedChatId],
            messages: [...currentMessages, { ...receivedMessage, status: "DELIVERED" }],
          },
        },
      };
    }

    // ===== SEND MESSAGE (HTTP fallback) =====

    case SEND_MESSAGE:
      return { ...state, sendingMessage: true, error: null };

    case SEND_MESSAGE_SUCCESS:
      // Optimistic message already in store — just clear flag
      return { ...state, sendingMessage: false, error: null };

    case SEND_MESSAGE_ERROR:
      return { ...state, sendingMessage: false, error: action.payload };

    // ===== GET MESSAGES =====

    case GET_CHAT_MESSAGES:
      return { ...state, loading: true, error: null };

    case GET_CHAT_MESSAGES_SUCCESS: {
      const { chatId, messages, page, hasMore } = action.payload;
      const existingChat = state.messagesByChat[chatId];

      return {
        ...state,
        loading: false,
        messageLoading: false,
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: {
            messages:
              page === 0
                ? messages
                : [...messages, ...(existingChat?.messages || [])],
            hasMore,
            page,
          },
        },
        error: null,
      };
    }

    case GET_CHAT_MESSAGES_ERROR:
      return { ...state, loading: false, messageLoading: false, error: action.payload };

    case GET_MESSAGES_SINCE_SUCCESS: {
      const { chatId: sinceChatId, messages: newMessages } = action.payload;
      const existingMessages = state.messagesByChat[sinceChatId]?.messages || [];
      return {
        ...state,
        loading: false,
        messagesByChat: {
          ...state.messagesByChat,
          [sinceChatId]: {
            ...state.messagesByChat[sinceChatId],
            messages: [...existingMessages, ...newMessages],
          },
        },
        error: null,
      };
    }

    // ===== MESSAGE EDIT/DELETE =====

    case MESSAGE_UPDATED: {
      const updatedMessage = action.payload;
      const updatedChatId = updatedMessage.chat.id;
      return {
        ...state,
        messagesByChat: {
          ...state.messagesByChat,
          [updatedChatId]: {
            ...state.messagesByChat[updatedChatId],
            messages: updateMessageInArray(
              state.messagesByChat[updatedChatId]?.messages || [],
              updatedMessage,
            ),
          },
        },
      };
    }

    case MESSAGE_DELETED: {
      const deletedMessageId = action.payload;
      const updatedMessagesByChat = Object.keys(state.messagesByChat).reduce(
        (acc, cid) => {
          acc[cid] = {
            ...state.messagesByChat[cid],
            messages: (state.messagesByChat[cid]?.messages || []).filter(
              (msg) => msg.id !== deletedMessageId,
            ),
          };
          return acc;
        },
        {},
      );
      return { ...state, messagesByChat: updatedMessagesByChat };
    }

    // Delete message (for everyone) - local immediate removal
    case DELETE_MESSAGE_SUCCESS: {
      const delId = action.payload;
      const delUpdated = Object.keys(state.messagesByChat).reduce((acc, cid) => {
        acc[cid] = {
          ...state.messagesByChat[cid],
          messages: (state.messagesByChat[cid]?.messages || []).filter(
            (msg) => msg.id !== delId,
          ),
        };
        return acc;
      }, {});
      return { ...state, messagesByChat: delUpdated };
    }

    // Delete for me - only remove from local store, no broadcast
    case DELETE_MESSAGE_FOR_ME_SUCCESS: {
      const delForMeId = action.payload;
      const delForMeUpdated = Object.keys(state.messagesByChat).reduce((acc, cid) => {
        acc[cid] = {
          ...state.messagesByChat[cid],
          messages: (state.messagesByChat[cid]?.messages || []).filter(
            (msg) => msg.id !== delForMeId,
          ),
        };
        return acc;
      }, {});
      return { ...state, messagesByChat: delForMeUpdated };
    }

    // ===== FILE UPLOAD =====

    case UPLOAD_FILE:
      return { ...state, uploadingFile: true, uploadProgress: 0, error: null };

    case UPLOAD_FILE_SUCCESS:
      return { ...state, uploadingFile: false, uploadProgress: 100, error: null };

    case UPLOAD_FILE_ERROR:
      return { ...state, uploadingFile: false, uploadProgress: 0, error: action.payload };

    // ===== TYPING =====

    case ADD_TYPING_USER: {
      const { chatId: typingChatId, user: typingUser } = action.payload;
      const currentTypingUsers = state.typingUsers[typingChatId] || [];
      if (currentTypingUsers.find((u) => u.id === typingUser.id)) return state;
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [typingChatId]: [...currentTypingUsers, typingUser],
        },
      };
    }

    case REMOVE_TYPING_USER: {
      const { chatId: stopTypingChatId, userId } = action.payload;
      const existingTypingUsers = state.typingUsers[stopTypingChatId] || [];
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [stopTypingChatId]: existingTypingUsers.filter((u) => u.id !== userId),
        },
      };
    }

    // ===== UI =====

    case SET_MESSAGE_LOADING:
      return { ...state, messageLoading: action.payload };

    case SET_MESSAGE_DRAFT:
      return {
        ...state,
        messageDrafts: {
          ...state.messageDrafts,
          [action.payload.chatId]: action.payload.content,
        },
      };

    case CLEAR_MESSAGE_DRAFT: {
      const { [action.payload]: removed, ...remainingDrafts } = state.messageDrafts;
      return { ...state, messageDrafts: remainingDrafts };
    }

    case CLEAR_MESSAGE_ERROR:
      return { ...state, error: null };

    case SET_REPLYING_TO:
      return { ...state, replyingTo: action.payload };

    case CLEAR_REPLYING_TO:
      return { ...state, replyingTo: null };

    default:
      return state;
  }
};

const updateMessageInArray = (messages, updatedMessage) => {
  const index = messages.findIndex((m) => m.id === updatedMessage.id);
  if (index >= 0) {
    const newMessages = [...messages];
    newMessages[index] = { ...newMessages[index], ...updatedMessage };
    return newMessages;
  }
  return [...messages, updatedMessage];
};

export default messageReducer;