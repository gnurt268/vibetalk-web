import api, { fileUploadApi } from "../../config/api";
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

export {
  selectMessagesByChat,
  selectMessageDraft,
  selectTypingUsers,
  selectSearchResults,
  selectMessagePermissions,
  selectIsMessageRead,
  selectLastMessage,
  selectUnreadMessageCount,
} from "./Selectors";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const sendMessage = (messageData) => async (dispatch) => {
  try {
    dispatch({ type: SEND_MESSAGE });

    const { content, chatId, messageType = "TEXT" } = messageData;

    const response = await api.post(
      "/api/messages/send",
      {
        content,
        chatId,
        messageType,
      },
      {
        headers: getAuthHeaders(),
      },
    );

    dispatch({
      type: SEND_MESSAGE_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: SEND_MESSAGE_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const getChatMessages =
  (chatId, page = 0, size = 30) =>
  async (dispatch) => {
    if (!chatId || chatId === "undefined") {
      console.error("Invalid chatId:", chatId);
      return;
    }
    try {
      dispatch({ type: GET_CHAT_MESSAGES });

      if (page === 0) {
        dispatch({ type: SET_MESSAGE_LOADING, payload: true });
      }

      const response = await api.get(`/api/messages/chat/${chatId}`, {
        params: { page, size },
        headers: getAuthHeaders(),
      });

      dispatch({
        type: GET_CHAT_MESSAGES_SUCCESS,
        payload: {
          chatId,
          messages: response.data,
          page,
          hasMore: response.data.length === size,
        },
      });

      dispatch({ type: SET_MESSAGE_LOADING, payload: false });

      return response.data;
    } catch (error) {
      dispatch({
        type: GET_CHAT_MESSAGES_ERROR,
        payload: error.response?.data?.message || error.message,
      });
      dispatch({ type: SET_MESSAGE_LOADING, payload: false });
      throw error;
    }
  };

export const getMessageById = (messageId) => async (dispatch) => {
  try {
    dispatch({ type: GET_MESSAGE_BY_ID });

    const response = await api.get(`/api/messages/${messageId}`, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: GET_MESSAGE_BY_ID_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: GET_MESSAGE_BY_ID_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const getMessagesSince =
  (chatId, lastMessageTime) => async (dispatch) => {
    try {
      dispatch({ type: GET_MESSAGES_SINCE });

      const response = await api.get(`/api/messages/chat/${chatId}/since`, {
        params: { lastMessageTime },
        headers: getAuthHeaders(),
      });

      dispatch({
        type: GET_MESSAGES_SINCE_SUCCESS,
        payload: {
          chatId,
          messages: response.data,
        },
      });

      return response.data;
    } catch (error) {
      dispatch({
        type: GET_MESSAGES_SINCE_ERROR,
        payload: error.response?.data?.message || error.message,
      });
      throw error;
    }
  };

export const getMessageCount = (chatId) => async (dispatch) => {
  try {
    dispatch({ type: GET_MESSAGE_COUNT });

    const response = await api.get(`/api/messages/chat/${chatId}/count`, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: GET_MESSAGE_COUNT_SUCCESS,
      payload: {
        chatId,
        count: response.data,
      },
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: GET_MESSAGE_COUNT_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const editMessage = (messageId, newContent) => async (dispatch) => {
  try {
    dispatch({ type: EDIT_MESSAGE });

    const response = await api.put(`/api/messages/${messageId}`, newContent, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "text/plain",
      },
    });

    dispatch({
      type: EDIT_MESSAGE_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: EDIT_MESSAGE_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const deleteMessage = (messageId) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_MESSAGE });

    await api.delete(`/api/messages/${messageId}`, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: DELETE_MESSAGE_SUCCESS,
      payload: messageId,
    });

    return messageId;
  } catch (error) {
    dispatch({
      type: DELETE_MESSAGE_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const deleteMessageForMe = (messageId) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_MESSAGE_FOR_ME });

    await api.delete(`/api/messages/${messageId}/for-me`, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: DELETE_MESSAGE_FOR_ME_SUCCESS,
      payload: messageId,
    });

    return messageId;
  } catch (error) {
    dispatch({
      type: DELETE_MESSAGE_FOR_ME_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const forwardMessage = (messageId, targetChatId) => async (dispatch) => {
  try {
    dispatch({ type: FORWARD_MESSAGE });

    const response = await api.post(
      `/api/messages/${messageId}/forward/${targetChatId}`,
      {},
      {
        headers: getAuthHeaders(),
      },
    );

    dispatch({
      type: FORWARD_MESSAGE_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: FORWARD_MESSAGE_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const searchMessagesInChat = (chatId, query) => async (dispatch) => {
  try {
    dispatch({ type: SEARCH_MESSAGES_IN_CHAT });

    const response = await api.get(`/api/messages/chat/${chatId}/search`, {
      params: { query },
      headers: getAuthHeaders(),
    });

    dispatch({
      type: SEARCH_MESSAGES_IN_CHAT_SUCCESS,
      payload: {
        chatId,
        query,
        results: response.data,
      },
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: SEARCH_MESSAGES_IN_CHAT_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const markChatAsRead = (chatId) => async (dispatch) => {
  if (!chatId || chatId === "undefined") {
    console.error("Invalid chatId for mark as read:", chatId);
    return;
  }
  try {
    dispatch({ type: MARK_MESSAGE_AS_READ });
    const response = await api.post(
      `/api/chats/${chatId}/mark-read`,
      {},
      {
        headers: getAuthHeaders(),
      },
    );

    dispatch({
      type: MARK_MESSAGE_AS_READ_SUCCESS,
      payload: { chatId, response: response.data },
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: MARK_MESSAGE_AS_READ_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const checkCanEditMessage = (messageId) => async (dispatch) => {
  try {
    dispatch({ type: CHECK_CAN_EDIT_MESSAGE });

    const response = await api.get(`/api/messages/${messageId}/can-edit`, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: CHECK_CAN_EDIT_MESSAGE_SUCCESS,
      payload: {
        messageId,
        canEdit: response.data,
      },
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: CHECK_CAN_EDIT_MESSAGE_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const checkCanDeleteMessage = (messageId) => async (dispatch) => {
  try {
    dispatch({ type: CHECK_CAN_DELETE_MESSAGE });

    const response = await api.get(`/api/messages/${messageId}/can-delete`, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: CHECK_CAN_DELETE_MESSAGE_SUCCESS,
      payload: {
        messageId,
        canDelete: response.data,
      },
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: CHECK_CAN_DELETE_MESSAGE_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const setActiveMessage = (message) => ({
  type: SET_ACTIVE_MESSAGE,
  payload: message,
});

export const setMessageLoading = (loading) => ({
  type: SET_MESSAGE_LOADING,
  payload: loading,
});

export const clearMessageError = () => ({
  type: CLEAR_MESSAGE_ERROR,
});

export const clearSearchResults = () => ({
  type: CLEAR_SEARCH_RESULTS,
});

export const setMessageDraft = (chatId, content) => ({
  type: SET_MESSAGE_DRAFT,
  payload: { chatId, content },
});

export const clearMessageDraft = (chatId) => ({
  type: CLEAR_MESSAGE_DRAFT,
  payload: chatId,
});

export const newMessageReceived = (message) => ({
  type: NEW_MESSAGE_RECEIVED,
  payload: message,
});

export const messageUpdated = (message) => ({
  type: MESSAGE_UPDATED,
  payload: message,
});

export const messageDeleted = (messageId) => ({
  type: MESSAGE_DELETED,
  payload: messageId,
});

export const setTypingUsers = (chatId, users) => ({
  type: SET_TYPING_USERS,
  payload: { chatId, users },
});

export const addTypingUser = (chatId, user) => ({
  type: ADD_TYPING_USER,
  payload: { chatId, user },
});

export const removeTypingUser = (chatId, userId) => ({
  type: REMOVE_TYPING_USER,
  payload: { chatId, userId },
});

export const loadChatMessagesWithStatus =
  (chatId) => async (dispatch, getState) => {
    try {
      const [messagesResult, countResult] = await Promise.all([
        dispatch(getChatMessages(chatId)),
        dispatch(getMessageCount(chatId)),
      ]);

      return {
        messages: messagesResult,
        count: countResult,
      };
    } catch (error) {
      console.error("Error loading chat messages with status:", error);
      throw error;
    }
  };

/**
 * Upload file/ảnh và gửi message.
 * @param {File} file - File object từ input
 * @param {number} chatId
 * @param {string} [caption] - Caption tùy chọn
 * @param {function} [onProgress] - Callback upload progress (0-100)
 */
export const uploadAndSendFile =
  (file, chatId, caption, onProgress) => async (dispatch) => {
    try {
      dispatch({ type: UPLOAD_FILE, payload: { chatId, fileName: file.name } });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatId", chatId);
      if (caption) {
        formData.append("caption", caption);
      }

      const response = await fileUploadApi.post(
        "/api/messages/upload",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              onProgress(percent);
            }
          },
        },
      );

      dispatch({
        type: UPLOAD_FILE_SUCCESS,
        payload: response.data,
      });

      return response.data;
    } catch (error) {
      dispatch({
        type: UPLOAD_FILE_ERROR,
        payload: error.response?.data?.message || error.message,
      });
      throw error;
    }
  };
