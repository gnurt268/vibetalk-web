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
      const newMessage = action.payload;
      const chatId = newMessage.chat.id;

      return {
        ...state,
        sendingMessage: false,
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: {
            ...state.messagesByChat[chatId],
            messages: [
              ...(state.messagesByChat[chatId]?.messages || []),
              newMessage,
            ],
          },
        },
        messageDrafts: {
          ...state.messageDrafts,
          [chatId]: "",
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
      const { chatId: getChatId, messages, page, hasMore } = action.payload;
      const existingChatMessages = state.messagesByChat[getChatId];

      return {
        ...state,
        loading: false,
        messageLoading: false,
        messagesByChat: {
          ...state.messagesByChat,
          [getChatId]: {
            messages:
              page === 0
                ? messages
                : [...(existingChatMessages?.messages || []), ...messages],
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

    case GET_MESSAGE_BY_ID:
      return {
        ...state,
        messageLoading: true,
        error: null,
      };

    case GET_MESSAGE_BY_ID_SUCCESS:
      const message = action.payload;
      const messageChatId = message.chat.id;

      return {
        ...state,
        messageLoading: false,
        messagesByChat: {
          ...state.messagesByChat,
          [messageChatId]: {
            ...state.messagesByChat[messageChatId],
            messages: updateMessageInArray(
              state.messagesByChat[messageChatId]?.messages || [],
              message
            ),
          },
        },
        error: null,
      };

    case GET_MESSAGE_BY_ID_ERROR:
      return {
        ...state,
        messageLoading: false,
        error: action.payload,
      };

    case GET_MESSAGES_SINCE:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_MESSAGES_SINCE_SUCCESS:
      const { chatId: sinceChatId, messages: newMessages } = action.payload;

      return {
        ...state,
        loading: false,
        messagesByChat: {
          ...state.messagesByChat,
          [sinceChatId]: {
            ...state.messagesByChat[sinceChatId],
            messages: [
              ...(state.messagesByChat[sinceChatId]?.messages || []),
              ...newMessages,
            ],
          },
        },
        error: null,
      };

    case GET_MESSAGES_SINCE_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case GET_MESSAGE_COUNT:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_MESSAGE_COUNT_SUCCESS:
      return {
        ...state,
        loading: false,
        messageCounts: {
          ...state.messageCounts,
          [action.payload.chatId]: action.payload.count,
        },
        error: null,
      };

    case GET_MESSAGE_COUNT_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case EDIT_MESSAGE:
      return {
        ...state,
        editingMessage: true,
        error: null,
      };

    case EDIT_MESSAGE_SUCCESS:
      const editedMessage = action.payload;
      const editedChatId = editedMessage.chat.id;

      return {
        ...state,
        editingMessage: false,
        messagesByChat: {
          ...state.messagesByChat,
          [editedChatId]: {
            ...state.messagesByChat[editedChatId],
            messages: updateMessageInArray(
              state.messagesByChat[editedChatId]?.messages || [],
              editedMessage
            ),
          },
        },
        error: null,
      };

    case EDIT_MESSAGE_ERROR:
      return {
        ...state,
        editingMessage: false,
        error: action.payload,
      };

    case DELETE_MESSAGE:
    case DELETE_MESSAGE_FOR_ME:
      return {
        ...state,
        deletingMessage: true,
        error: null,
      };

    case DELETE_MESSAGE_SUCCESS:
    case DELETE_MESSAGE_FOR_ME_SUCCESS:
      const deletedId = action.payload;
      const updatedMessagesByChat = Object.keys(state.messagesByChat).reduce(
        (acc, chatId) => {
          acc[chatId] = {
            ...state.messagesByChat[chatId],
            messages: state.messagesByChat[chatId].messages.filter(
              (msg) => msg.id !== deletedId
            ),
          };
          return acc;
        },
        {}
      );

      return {
        ...state,
        deletingMessage: false,
        messagesByChat: updatedMessagesByChat,
        activeMessage:
          state.activeMessage?.id === deletedId ? null : state.activeMessage,
        error: null,
      };

    case DELETE_MESSAGE_ERROR:
    case DELETE_MESSAGE_FOR_ME_ERROR:
      return {
        ...state,
        deletingMessage: false,
        error: action.payload,
      };

    case FORWARD_MESSAGE:
      return {
        ...state,
        forwardingMessage: true,
        error: null,
      };

    case FORWARD_MESSAGE_SUCCESS:
      return {
        ...state,
        forwardingMessage: false,
        error: null,
      };

    case FORWARD_MESSAGE_ERROR:
      return {
        ...state,
        forwardingMessage: false,
        error: action.payload,
      };

    case SEARCH_MESSAGES_IN_CHAT:
      return {
        ...state,
        searchingMessages: true,
        error: null,
      };

    case SEARCH_MESSAGES_IN_CHAT_SUCCESS:
      return {
        ...state,
        searchingMessages: false,
        searchResults: {
          ...state.searchResults,
          [action.payload.chatId]: action.payload,
        },
        error: null,
      };

    case SEARCH_MESSAGES_IN_CHAT_ERROR:
      return {
        ...state,
        searchingMessages: false,
        error: action.payload,
      };

    case MARK_MESSAGE_AS_READ:
      return {
        ...state,
        error: null,
      };

    case MARK_MESSAGE_AS_READ_SUCCESS:
      const { chatId: readChatId } = action.payload;
      const chatMessages = state.messagesByChat[readChatId]?.messages || [];
      const readMessageIds = new Set([...state.readMessages]);
      chatMessages.forEach((msg) => readMessageIds.add(msg.id));

      return {
        ...state,
        readMessages: readMessageIds,
        error: null,
      };

    case MARK_MESSAGE_AS_READ_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case CHECK_CAN_EDIT_MESSAGE_SUCCESS:
      return {
        ...state,
        messagePermissions: {
          ...state.messagePermissions,
          [action.payload.messageId]: {
            ...state.messagePermissions[action.payload.messageId],
            canEdit: action.payload.canEdit,
          },
        },
      };

    case CHECK_CAN_DELETE_MESSAGE_SUCCESS:
      return {
        ...state,
        messagePermissions: {
          ...state.messagePermissions,
          [action.payload.messageId]: {
            ...state.messagePermissions[action.payload.messageId],
            canDelete: action.payload.canDelete,
          },
        },
      };

    case CHECK_CAN_EDIT_MESSAGE_ERROR:
    case CHECK_CAN_DELETE_MESSAGE_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case SET_ACTIVE_MESSAGE:
      return {
        ...state,
        activeMessage: action.payload,
      };

    case CLEAR_ACTIVE_MESSAGE:
      return {
        ...state,
        activeMessage: null,
      };

    case SET_MESSAGE_LOADING:
      return {
        ...state,
        messageLoading: action.payload,
      };

    case CLEAR_MESSAGE_ERROR:
      return {
        ...state,
        error: null,
      };

    case CLEAR_SEARCH_RESULTS:
      return {
        ...state,
        searchResults: {},
      };

    case SET_MESSAGE_DRAFT:
      return {
        ...state,
        messageDrafts: {
          ...state.messageDrafts,
          [action.payload.chatId]: action.payload.content,
        },
      };

    case CLEAR_MESSAGE_DRAFT:
      const { [action.payload]: removed, ...remainingDrafts } =
        state.messageDrafts;
      return {
        ...state,
        messageDrafts: remainingDrafts,
      };

    case NEW_MESSAGE_RECEIVED:
      const receivedMessage = action.payload;
      const receivedChatId = receivedMessage.chat?.id;

      if (!receivedChatId) {
        console.error("No chat ID in received message");
        return state;
      }

      const newState = {
        ...state,
        messagesByChat: {
          ...state.messagesByChat,
          [receivedChatId]: {
            ...state.messagesByChat[receivedChatId],
            messages: [
              ...(state.messagesByChat[receivedChatId]?.messages || []),
              receivedMessage,
            ],
          },
        },
      };

      return newState;

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
              updatedMessage
            ),
          },
        },
        activeMessage:
          state.activeMessage?.id === updatedMessage.id
            ? updatedMessage
            : state.activeMessage,
      };

    case MESSAGE_DELETED:
      const deletedMessageId = action.payload;
      const deletedUpdatedMessagesByChat = Object.keys(
        state.messagesByChat
      ).reduce((acc, chatId) => {
        acc[chatId] = {
          ...state.messagesByChat[chatId],
          messages: state.messagesByChat[chatId].messages.filter(
            (msg) => msg.id !== deletedMessageId
          ),
        };
        return acc;
      }, {});

      return {
        ...state,
        messagesByChat: deletedUpdatedMessagesByChat,
        activeMessage:
          state.activeMessage?.id === deletedMessageId
            ? null
            : state.activeMessage,
      };

    case SET_TYPING_USERS:
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.chatId]: action.payload.users,
        },
      };

    case ADD_TYPING_USER:
      const { chatId: typingChatId, user: typingUser } = action.payload;
      const currentTypingUsers = state.typingUsers[typingChatId] || [];
      if (currentTypingUsers.find((u) => u.id === typingUser.id)) {
        return state;
      }

      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [typingChatId]: [...currentTypingUsers, typingUser],
        },
      };

    case REMOVE_TYPING_USER:
      const { chatId: stopTypingChatId, userId } = action.payload;
      const existingTypingUsers = state.typingUsers[stopTypingChatId] || [];

      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [stopTypingChatId]: existingTypingUsers.filter(
            (user) => user.id !== userId
          ),
        },
      };

    default:
      return state;
  }
};

const updateMessageInArray = (messages, updatedMessage) => {
  const existingIndex = messages.findIndex(
    (msg) => msg.id === updatedMessage.id
  );
  if (existingIndex >= 0) {
    const updatedMessages = [...messages];
    updatedMessages[existingIndex] = updatedMessage;
    return updatedMessages;
  }
  return [...messages, updatedMessage];
};

export default messageReducer;
