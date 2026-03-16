import {
  SEND_MESSAGE,
  SEND_MESSAGE_SUCCESS,
  SEND_MESSAGE_ERROR,
  GET_CHAT_MESSAGES,
  GET_CHAT_MESSAGES_SUCCESS,
  GET_CHAT_MESSAGES_ERROR,
  GET_MESSAGE_BY_ID,
  GET_MESSAGE_BY_ID_SUCCESS,
  GET_MESSAGE_BY_ID_ERROR,
  GET_MESSAGES_SINCE,
  GET_MESSAGES_SINCE_SUCCESS,
  GET_MESSAGES_SINCE_ERROR,
  GET_MESSAGE_COUNT,
  GET_MESSAGE_COUNT_SUCCESS,
  GET_MESSAGE_COUNT_ERROR,
  EDIT_MESSAGE,
  EDIT_MESSAGE_SUCCESS,
  EDIT_MESSAGE_ERROR,
  DELETE_MESSAGE,
  DELETE_MESSAGE_SUCCESS,
  DELETE_MESSAGE_ERROR,
  DELETE_MESSAGE_FOR_ME,
  DELETE_MESSAGE_FOR_ME_SUCCESS,
  DELETE_MESSAGE_FOR_ME_ERROR,
  FORWARD_MESSAGE,
  FORWARD_MESSAGE_SUCCESS,
  FORWARD_MESSAGE_ERROR,
  SEARCH_MESSAGES_IN_CHAT,
  SEARCH_MESSAGES_IN_CHAT_SUCCESS,
  SEARCH_MESSAGES_IN_CHAT_ERROR,
  MARK_MESSAGE_AS_READ,
  MARK_MESSAGE_AS_READ_SUCCESS,
  MARK_MESSAGE_AS_READ_ERROR,
  CHECK_CAN_EDIT_MESSAGE,
  CHECK_CAN_EDIT_MESSAGE_SUCCESS,
  CHECK_CAN_EDIT_MESSAGE_ERROR,
  CHECK_CAN_DELETE_MESSAGE,
  CHECK_CAN_DELETE_MESSAGE_SUCCESS,
  CHECK_CAN_DELETE_MESSAGE_ERROR,
  SET_ACTIVE_MESSAGE,
  CLEAR_ACTIVE_MESSAGE,
  SET_MESSAGE_LOADING,
  CLEAR_MESSAGE_ERROR,
  CLEAR_SEARCH_RESULTS,
  SET_MESSAGE_DRAFT,
  CLEAR_MESSAGE_DRAFT,
  NEW_MESSAGE_RECEIVED,
  MESSAGE_UPDATED,
  MESSAGE_DELETED,
  SET_TYPING_USERS,
  ADD_TYPING_USER,
  REMOVE_TYPING_USER,
  UPLOAD_FILE,
  UPLOAD_FILE_SUCCESS,
  UPLOAD_FILE_ERROR,
} from "./ActionType";

const initialState = {
  messagesByChat: {},
  activeMessage: null,
  loading: false,
  messageLoading: false,
  sendingMessage: false,
  editingMessage: false,
  deletingMessage: false,
  forwardingMessage: false,
  searchingMessages: false,
  uploadingFile: false,
  uploadProgress: 0,
  error: null,
  searchResults: {},
  messageCounts: {},
  messagePermissions: {},
  typingUsers: {},
  messageDrafts: {},
  readMessages: new Set(),
};

const messageReducer = (state = initialState, action) => {
  switch (action.type) {
    case SEND_MESSAGE:
      return {
        ...state,
        sendingMessage: true,
        error: null,
      };

    case SEND_MESSAGE_SUCCESS:
      const sentMessage = action.payload;
      const sentChatId = sentMessage.chat.id;

      return {
        ...state,
        sendingMessage: false,
        messageDrafts: {
          ...state.messageDrafts,
          [sentChatId]: "",
        },
        error: null,
      };

    case SEND_MESSAGE_ERROR:
      return {
        ...state,
        sendingMessage: false,
        error: action.payload,
      };

    case GET_CHAT_MESSAGES:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_CHAT_MESSAGES_SUCCESS:
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

    case GET_CHAT_MESSAGES_ERROR:
      return {
        ...state,
        loading: false,
        messageLoading: false,
        error: action.payload,
      };

    case GET_MESSAGES_SINCE_SUCCESS:
      const { chatId: sinceChatId, messages: newMessages } = action.payload;
      const existingMessages =
        state.messagesByChat[sinceChatId]?.messages || [];

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

    case NEW_MESSAGE_RECEIVED:
      const receivedMessage = action.payload;
      const receivedChatId = receivedMessage.chat?.id;

      if (!receivedChatId) return state;

      const currentMessages =
        state.messagesByChat[receivedChatId]?.messages || [];

      if (currentMessages.some((m) => m.id === receivedMessage.id)) {
        return state;
      }

      return {
        ...state,
        messagesByChat: {
          ...state.messagesByChat,
          [receivedChatId]: {
            ...state.messagesByChat[receivedChatId],
            messages: [...currentMessages, receivedMessage],
          },
        },
      };

    case MESSAGE_UPDATED:
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

    case MESSAGE_DELETED:
      const deletedMessageId = action.payload;

      const updatedMessagesByChat = Object.keys(state.messagesByChat).reduce(
        (acc, chatId) => {
          acc[chatId] = {
            ...state.messagesByChat[chatId],
            messages: state.messagesByChat[chatId].messages.filter(
              (msg) => msg.id !== deletedMessageId,
            ),
          };
          return acc;
        },
        {},
      );

      return {
        ...state,
        messagesByChat: updatedMessagesByChat,
      };

    case UPLOAD_FILE:
      return {
        ...state,
        uploadingFile: true,
        uploadProgress: 0,
        error: null,
      };

    case UPLOAD_FILE_SUCCESS:
      return {
        ...state,
        uploadingFile: false,
        uploadProgress: 100,
        error: null,
      };

    case UPLOAD_FILE_ERROR:
      return {
        ...state,
        uploadingFile: false,
        uploadProgress: 0,
        error: action.payload,
      };

    default:
      return state;
  }
};

const updateMessageInArray = (messages, updatedMessage) => {
  const index = messages.findIndex((m) => m.id === updatedMessage.id);

  if (index >= 0) {
    const newMessages = [...messages];
    newMessages[index] = updatedMessage;
    return newMessages;
  }

  return [...messages, updatedMessage];
};

export default messageReducer;
