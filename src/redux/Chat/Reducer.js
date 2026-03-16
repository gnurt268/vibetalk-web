import {
  CREATE_PRIVATE_CHAT,
  CREATE_PRIVATE_CHAT_SUCCESS,
  CREATE_PRIVATE_CHAT_ERROR,
  FIND_PRIVATE_CHAT,
  FIND_PRIVATE_CHAT_SUCCESS,
  FIND_PRIVATE_CHAT_ERROR,
  CREATE_GROUP_CHAT,
  CREATE_GROUP_CHAT_SUCCESS,
  CREATE_GROUP_CHAT_ERROR,
  GET_USER_CHATS,
  GET_USER_CHATS_SUCCESS,
  GET_USER_CHATS_ERROR,
  GET_USER_GROUP_CHATS,
  GET_USER_GROUP_CHATS_SUCCESS,
  GET_USER_GROUP_CHATS_ERROR,
  GET_USER_PRIVATE_CHATS,
  GET_USER_PRIVATE_CHATS_SUCCESS,
  GET_USER_PRIVATE_CHATS_ERROR,
  GET_ADMIN_CHATS,
  GET_ADMIN_CHATS_SUCCESS,
  GET_ADMIN_CHATS_ERROR,
  GET_CHAT_BY_ID,
  GET_CHAT_BY_ID_SUCCESS,
  GET_CHAT_BY_ID_ERROR,
  SEARCH_CHATS,
  SEARCH_CHATS_SUCCESS,
  SEARCH_CHATS_ERROR,
  ADD_USER_TO_GROUP,
  ADD_USER_TO_GROUP_SUCCESS,
  ADD_USER_TO_GROUP_ERROR,
  REMOVE_USER_FROM_GROUP,
  REMOVE_USER_FROM_GROUP_SUCCESS,
  REMOVE_USER_FROM_GROUP_ERROR,
  UPDATE_GROUP_CHAT,
  UPDATE_GROUP_CHAT_SUCCESS,
  UPDATE_GROUP_CHAT_ERROR,
  DELETE_GROUP_CHAT,
  DELETE_GROUP_CHAT_SUCCESS,
  DELETE_GROUP_CHAT_ERROR,
  LEAVE_GROUP,
  LEAVE_GROUP_SUCCESS,
  LEAVE_GROUP_ERROR,
  MAKE_ADMIN,
  MAKE_ADMIN_SUCCESS,
  MAKE_ADMIN_ERROR,
  REMOVE_ADMIN,
  REMOVE_ADMIN_SUCCESS,
  REMOVE_ADMIN_ERROR,
  MARK_CHAT_AS_READ,
  MARK_CHAT_AS_READ_SUCCESS,
  MARK_CHAT_AS_READ_ERROR,
  GET_UNREAD_COUNT,
  GET_UNREAD_COUNT_SUCCESS,
  GET_UNREAD_COUNT_ERROR,
  CHECK_CHAT_ACCESS,
  CHECK_CHAT_ACCESS_SUCCESS,
  CHECK_CHAT_ACCESS_ERROR,
  CHECK_IS_ADMIN,
  CHECK_IS_ADMIN_SUCCESS,
  CHECK_IS_ADMIN_ERROR,
  CHECK_IS_OWNER,
  CHECK_IS_OWNER_SUCCESS,
  CHECK_IS_OWNER_ERROR,
  SET_ACTIVE_CHAT,
  CLEAR_ACTIVE_CHAT,
  SET_CHAT_LOADING,
  CLEAR_CHAT_ERROR,
  CHAT_UPDATED,
  USER_JOINED_CHAT,
  USER_LEFT_CHAT,
  CHAT_DELETED,
  GET_ALL_UNREAD_COUNTS,
  GET_ALL_UNREAD_COUNTS_SUCCESS,
  GET_ALL_UNREAD_COUNTS_ERROR,
  CLEAR_UNREAD_COUNT,
  INCREMENT_UNREAD_COUNT,
  UPDATE_CHAT_LAST_MESSAGE,
} from "./ActionType";

const initialState = {
  chats: [],
  groupChats: [],
  privateChats: [],
  adminChats: [],
  searchResults: [],

  activeChat: null,
  currentChatDetails: null,

  loading: false,
  chatLoading: false,
  error: null,

  unreadCounts: {},
  chatPermissions: {},
  isCreatingChat: false,
  isUpdatingChat: false,
  isDeletingChat: false,
  isAddingUser: false,
  isRemovingUser: false,
  isLeavingGroup: false,
  isMarkingRead: false,
  isSearching: false,
};

const chatReducer = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_PRIVATE_CHAT:
    case FIND_PRIVATE_CHAT:
      return {
        ...state,
        isCreatingChat: true,
        error: null,
      };

    case CREATE_PRIVATE_CHAT_SUCCESS:
    case FIND_PRIVATE_CHAT_SUCCESS:
      return {
        ...state,
        isCreatingChat: false,
        chats: addOrUpdateChat(state.chats, action.payload),
        privateChats: addOrUpdateChat(state.privateChats, action.payload),
        activeChat: action.payload,
        error: null,
      };

    case CREATE_PRIVATE_CHAT_ERROR:
    case FIND_PRIVATE_CHAT_ERROR:
      return {
        ...state,
        isCreatingChat: false,
        error: action.payload,
      };

    case CREATE_GROUP_CHAT:
      return {
        ...state,
        isCreatingChat: true,
        error: null,
      };

    case CREATE_GROUP_CHAT_SUCCESS:
      return {
        ...state,
        isCreatingChat: false,
        chats: addOrUpdateChat(state.chats, action.payload),
        groupChats: addOrUpdateChat(state.groupChats, action.payload),
        activeChat: action.payload,
        error: null,
      };

    case CREATE_GROUP_CHAT_ERROR:
      return {
        ...state,
        isCreatingChat: false,
        error: action.payload,
      };

    case UPDATE_GROUP_CHAT:
      return {
        ...state,
        isUpdatingChat: true,
        error: null,
      };

    case UPDATE_GROUP_CHAT_SUCCESS:
      return {
        ...state,
        isUpdatingChat: false,
        chats: updateChatInArray(state.chats, action.payload),
        groupChats: updateChatInArray(state.groupChats, action.payload),
        activeChat:
          state.activeChat?.id === action.payload.id
            ? action.payload
            : state.activeChat,
        error: null,
      };

    case UPDATE_GROUP_CHAT_ERROR:
      return {
        ...state,
        isUpdatingChat: false,
        error: action.payload,
      };

    case DELETE_GROUP_CHAT:
      return {
        ...state,
        isDeletingChat: true,
        error: null,
      };

    case DELETE_GROUP_CHAT_SUCCESS:
      return {
        ...state,
        isDeletingChat: false,
        chats: state.chats.filter((chat) => chat.id !== action.payload),
        groupChats: state.groupChats.filter(
          (chat) => chat.id !== action.payload
        ),
        adminChats: state.adminChats.filter(
          (chat) => chat.id !== action.payload
        ),
        activeChat:
          state.activeChat?.id === action.payload ? null : state.activeChat,
        error: null,
      };

    case DELETE_GROUP_CHAT_ERROR:
      return {
        ...state,
        isDeletingChat: false,
        error: action.payload,
      };

    case GET_USER_CHATS:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_USER_CHATS_SUCCESS:
      return {
        ...state,
        loading: false,
        chats: action.payload,
        error: null,
      };

    case GET_USER_CHATS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case GET_USER_GROUP_CHATS:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_USER_GROUP_CHATS_SUCCESS:
      return {
        ...state,
        loading: false,
        groupChats: action.payload,
        error: null,
      };

    case GET_USER_GROUP_CHATS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case GET_USER_PRIVATE_CHATS:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_USER_PRIVATE_CHATS_SUCCESS:
      return {
        ...state,
        loading: false,
        privateChats: action.payload,
        error: null,
      };

    case GET_USER_PRIVATE_CHATS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case GET_ADMIN_CHATS:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_ADMIN_CHATS_SUCCESS:
      return {
        ...state,
        loading: false,
        adminChats: action.payload,
        error: null,
      };

    case GET_ADMIN_CHATS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case GET_CHAT_BY_ID:
      return {
        ...state,
        chatLoading: true,
        error: null,
      };

    case GET_CHAT_BY_ID_SUCCESS:
      return {
        ...state,
        chatLoading: false,
        currentChatDetails: action.payload,
        chats: addOrUpdateChat(state.chats, action.payload),
        error: null,
      };

    case GET_CHAT_BY_ID_ERROR:
      return {
        ...state,
        chatLoading: false,
        error: action.payload,
      };

    case SEARCH_CHATS:
      return {
        ...state,
        isSearching: true,
        error: null,
      };

    case SEARCH_CHATS_SUCCESS:
      return {
        ...state,
        isSearching: false,
        searchResults: action.payload,
        error: null,
      };

    case SEARCH_CHATS_ERROR:
      return {
        ...state,
        isSearching: false,
        error: action.payload,
      };

    case ADD_USER_TO_GROUP:
      return {
        ...state,
        isAddingUser: true,
        error: null,
      };

    case ADD_USER_TO_GROUP_SUCCESS:
      return {
        ...state,
        isAddingUser: false,
        chats: updateChatInArray(state.chats, action.payload),
        groupChats: updateChatInArray(state.groupChats, action.payload),
        activeChat:
          state.activeChat?.id === action.payload.id
            ? action.payload
            : state.activeChat,
        error: null,
      };

    case ADD_USER_TO_GROUP_ERROR:
      return {
        ...state,
        isAddingUser: false,
        error: action.payload,
      };

    case REMOVE_USER_FROM_GROUP:
      return {
        ...state,
        isRemovingUser: true,
        error: null,
      };

    case REMOVE_USER_FROM_GROUP_SUCCESS:
      return {
        ...state,
        isRemovingUser: false,
        chats: updateChatInArray(state.chats, action.payload),
        groupChats: updateChatInArray(state.groupChats, action.payload),
        activeChat:
          state.activeChat?.id === action.payload.id
            ? action.payload
            : state.activeChat,
        error: null,
      };

    case REMOVE_USER_FROM_GROUP_ERROR:
      return {
        ...state,
        isRemovingUser: false,
        error: action.payload,
      };

    case LEAVE_GROUP:
      return {
        ...state,
        isLeavingGroup: true,
        error: null,
      };

    case LEAVE_GROUP_SUCCESS:
      return {
        ...state,
        isLeavingGroup: false,
        chats: state.chats.filter((chat) => chat.id !== action.payload),
        groupChats: state.groupChats.filter(
          (chat) => chat.id !== action.payload
        ),
        adminChats: state.adminChats.filter(
          (chat) => chat.id !== action.payload
        ),
        activeChat:
          state.activeChat?.id === action.payload ? null : state.activeChat,
        error: null,
      };

    case LEAVE_GROUP_ERROR:
      return {
        ...state,
        isLeavingGroup: false,
        error: action.payload,
      };

    case MAKE_ADMIN:
    case REMOVE_ADMIN:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case MAKE_ADMIN_SUCCESS:
    case REMOVE_ADMIN_SUCCESS:
      return {
        ...state,
        loading: false,
        chats: updateChatInArray(state.chats, action.payload),
        groupChats: updateChatInArray(state.groupChats, action.payload),
        adminChats: updateChatInArray(state.adminChats, action.payload),
        activeChat:
          state.activeChat?.id === action.payload.id
            ? action.payload
            : state.activeChat,
        error: null,
      };

    case MAKE_ADMIN_ERROR:
    case REMOVE_ADMIN_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case MARK_CHAT_AS_READ:
      return {
        ...state,
        isMarkingRead: true,
        error: null,
      };

    case MARK_CHAT_AS_READ_SUCCESS:
      return {
        ...state,
        isMarkingRead: false,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.chatId]: 0,
        },
        error: null,
      };

    case MARK_CHAT_AS_READ_ERROR:
      return {
        ...state,
        isMarkingRead: false,
        error: action.payload,
      };

    case GET_UNREAD_COUNT:
      return {
        ...state,
        error: null,
      };

    case GET_UNREAD_COUNT_SUCCESS:
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.chatId]: action.payload.count,
        },
        error: null,
      };

    case GET_UNREAD_COUNT_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case CHECK_CHAT_ACCESS_SUCCESS:
      return {
        ...state,
        chatPermissions: {
          ...state.chatPermissions,
          [action.payload.chatId]: {
            ...state.chatPermissions[action.payload.chatId],
            hasAccess: action.payload.hasAccess,
          },
        },
      };

    case CHECK_IS_ADMIN_SUCCESS:
      return {
        ...state,
        chatPermissions: {
          ...state.chatPermissions,
          [action.payload.chatId]: {
            ...state.chatPermissions[action.payload.chatId],
            isAdmin: action.payload.isAdmin,
          },
        },
      };

    case CHECK_IS_OWNER_SUCCESS:
      return {
        ...state,
        chatPermissions: {
          ...state.chatPermissions,
          [action.payload.chatId]: {
            ...state.chatPermissions[action.payload.chatId],
            isOwner: action.payload.isOwner,
          },
        },
      };

    case SET_ACTIVE_CHAT:
      return {
        ...state,
        activeChat: action.payload,
      };

    case CLEAR_ACTIVE_CHAT:
      return {
        ...state,
        activeChat: null,
        currentChatDetails: null,
      };

    case SET_CHAT_LOADING:
      return {
        ...state,
        chatLoading: action.payload,
      };

    case CLEAR_CHAT_ERROR:
      return {
        ...state,
        error: null,
      };

    case CHAT_UPDATED:
      return {
        ...state,
        chats: updateChatInArray(state.chats, action.payload),
        groupChats: updateChatInArray(state.groupChats, action.payload),
        privateChats: updateChatInArray(state.privateChats, action.payload),
        adminChats: updateChatInArray(state.adminChats, action.payload),
        activeChat:
          state.activeChat?.id === action.payload.id
            ? action.payload
            : state.activeChat,
      };

    case USER_JOINED_CHAT:
      return {
        ...state,
        chats: updateChatInArray(state.chats, action.payload.chat),
        groupChats: updateChatInArray(state.groupChats, action.payload.chat),
        activeChat:
          state.activeChat?.id === action.payload.chat.id
            ? action.payload.chat
            : state.activeChat,
      };

    case USER_LEFT_CHAT:
      return {
        ...state,
        chats: updateChatInArray(state.chats, action.payload.chat),
        groupChats: updateChatInArray(state.groupChats, action.payload.chat),
        activeChat:
          state.activeChat?.id === action.payload.chat.id
            ? action.payload.chat
            : state.activeChat,
      };

    case CHAT_DELETED:
      return {
        ...state,
        chats: state.chats.filter((chat) => chat.id !== action.payload),
        groupChats: state.groupChats.filter(
          (chat) => chat.id !== action.payload
        ),
        privateChats: state.privateChats.filter(
          (chat) => chat.id !== action.payload
        ),
        adminChats: state.adminChats.filter(
          (chat) => chat.id !== action.payload
        ),
        activeChat:
          state.activeChat?.id === action.payload ? null : state.activeChat,
      };

    case GET_ALL_UNREAD_COUNTS_SUCCESS:
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          ...action.payload,
        },
      };

    case CLEAR_UNREAD_COUNT:
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload]: 0,
        },
      };

    case INCREMENT_UNREAD_COUNT:
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload]: (state.unreadCounts[action.payload] || 0) + 1,
        },
      };

    case UPDATE_CHAT_LAST_MESSAGE:
      const { chatId: lmChatId, lastMessage: lmData } = action.payload;
      return {
        ...state,
        chats: state.chats.map((c) =>
          c.id === lmChatId ? { ...c, _lastMessage: lmData } : c
        ),
      };

    default:
      return state;
  }
};

const addOrUpdateChat = (chatArray, newChat) => {
  const safeArray = Array.isArray(chatArray) ? chatArray : [];
  if (!newChat || !newChat.id) {
    console.warn("Invalid newChat object:", newChat);
    return safeArray;
  }

  const existingIndex = safeArray.findIndex((chat) => chat?.id === newChat.id);
  if (existingIndex >= 0) {
    const updatedArray = [...safeArray];
    updatedArray[existingIndex] = newChat;
    return updatedArray;
  }
  return [newChat, ...safeArray];
};

const updateChatInArray = (chatArray, updatedChat) => {
  const safeArray = Array.isArray(chatArray) ? chatArray : [];
  if (!updatedChat || !updatedChat.id) {
    console.warn("Invalid updatedChat object:", updatedChat);
    return safeArray;
  }

  return safeArray.map((chat) =>
    chat?.id === updatedChat.id ? updatedChat : chat
  );
};

export default chatReducer;