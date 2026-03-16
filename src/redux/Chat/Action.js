import api from "../../config/api";
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
  SET_CHAT_LOADING,
  CLEAR_CHAT_ERROR,
  GET_ALL_UNREAD_COUNTS,
  GET_ALL_UNREAD_COUNTS_SUCCESS,
  GET_ALL_UNREAD_COUNTS_ERROR,
  CLEAR_UNREAD_COUNT,
  INCREMENT_UNREAD_COUNT,
} from "./ActionType";
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const findPrivateChat = (otherUserId) => async (dispatch) => {
  try {
    dispatch({ type: FIND_PRIVATE_CHAT });

    const response = await api.get(`/api/chats/private/find/${otherUserId}`, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: FIND_PRIVATE_CHAT_SUCCESS,
      payload: response.data,
    });
    dispatch(setActiveChat(response.data));

    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      dispatch({
        type: FIND_PRIVATE_CHAT_ERROR,
        payload: "Chat not found",
      });
      throw error;
    }

    dispatch({
      type: FIND_PRIVATE_CHAT_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const createPrivateChat = (userId) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_PRIVATE_CHAT });

    const response = await api.post(
      `/api/chats/private/${userId}`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );

    dispatch({
      type: CREATE_PRIVATE_CHAT_SUCCESS,
      payload: response.data,
    });
    dispatch(setActiveChat(response.data));

    return response.data;
  } catch (error) {
    dispatch({
      type: CREATE_PRIVATE_CHAT_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const createGroupChat = (groupData) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_GROUP_CHAT });

    const response = await api.post("/api/chats/group", groupData, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: CREATE_GROUP_CHAT_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: CREATE_GROUP_CHAT_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const updateGroupChat = (chatId, updateData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_GROUP_CHAT });

    const response = await api.put(`/api/chats/${chatId}`, updateData, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: UPDATE_GROUP_CHAT_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: UPDATE_GROUP_CHAT_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const deleteGroupChat = (chatId) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_GROUP_CHAT });

    await api.delete(`/api/chats/${chatId}`, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: DELETE_GROUP_CHAT_SUCCESS,
      payload: chatId,
    });

    return chatId;
  } catch (error) {
    dispatch({
      type: DELETE_GROUP_CHAT_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const getUserChats = () => async (dispatch) => {
  try {
    dispatch({ type: GET_USER_CHATS });

    const response = await api.get("/api/chats/summaries", {
      headers: getAuthHeaders(),
    });

    const summaries = response.data;
    const chats = summaries.map((s) => ({
      ...s.chat,
      _lastMessage: s.lastMessage,
    }));
    const unreadCounts = {};
    summaries.forEach((s) => {
      if (s.unreadCount > 0) {
        unreadCounts[s.chat.id] = s.unreadCount;
      }
    });

    dispatch({
      type: GET_USER_CHATS_SUCCESS,
      payload: chats,
    });

    dispatch({
      type: GET_ALL_UNREAD_COUNTS_SUCCESS,
      payload: unreadCounts,
    });

    return chats;
  } catch (error) {
    dispatch({
      type: GET_USER_CHATS_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const getUserGroupChats = () => async (dispatch) => {
  try {
    dispatch({ type: GET_USER_GROUP_CHATS });

    const response = await api.get("/api/chats/groups", {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: GET_USER_GROUP_CHATS_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: GET_USER_GROUP_CHATS_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const getUserPrivateChats = () => async (dispatch) => {
  try {
    dispatch({ type: GET_USER_PRIVATE_CHATS });

    const response = await api.get("/api/chats/private", {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: GET_USER_PRIVATE_CHATS_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: GET_USER_PRIVATE_CHATS_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const getAdminChats = () => async (dispatch) => {
  try {
    dispatch({ type: GET_ADMIN_CHATS });

    const response = await api.get("/api/chats/admin-groups", {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: GET_ADMIN_CHATS_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: GET_ADMIN_CHATS_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const getChatById = (chatId) => async (dispatch) => {
  try {
    dispatch({ type: GET_CHAT_BY_ID });

    const response = await api.get(`/api/chats/${chatId}`, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: GET_CHAT_BY_ID_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: GET_CHAT_BY_ID_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const searchChats = (query) => async (dispatch) => {
  try {
    dispatch({ type: SEARCH_CHATS });

    const response = await api.get("/api/chats/search", {
      params: { query },
      headers: getAuthHeaders(),
    });

    dispatch({
      type: SEARCH_CHATS_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: SEARCH_CHATS_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const addUserToGroup = (chatId, userId) => async (dispatch) => {
  try {
    dispatch({ type: ADD_USER_TO_GROUP });

    const response = await api.post(
      `/api/chats/${chatId}/members/${userId}`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );

    dispatch({
      type: ADD_USER_TO_GROUP_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: ADD_USER_TO_GROUP_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const removeUserFromGroup = (chatId, userId) => async (dispatch) => {
  try {
    dispatch({ type: REMOVE_USER_FROM_GROUP });

    const response = await api.delete(
      `/api/chats/${chatId}/members/${userId}`,
      {
        headers: getAuthHeaders(),
      }
    );

    dispatch({
      type: REMOVE_USER_FROM_GROUP_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: REMOVE_USER_FROM_GROUP_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const leaveGroup = (chatId) => async (dispatch) => {
  try {
    dispatch({ type: LEAVE_GROUP });

    const response = await api.post(
      `/api/chats/${chatId}/leave`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );

    dispatch({
      type: LEAVE_GROUP_SUCCESS,
      payload: chatId,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: LEAVE_GROUP_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const makeAdmin = (chatId, userId) => async (dispatch) => {
  try {
    dispatch({ type: MAKE_ADMIN });

    const response = await api.put(
      `/api/chats/${chatId}/admin/${userId}`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );

    dispatch({
      type: MAKE_ADMIN_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: MAKE_ADMIN_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const removeAdmin = (chatId, userId) => async (dispatch) => {
  try {
    dispatch({ type: REMOVE_ADMIN });

    const response = await api.delete(`/api/chats/${chatId}/admin/${userId}`, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: REMOVE_ADMIN_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: REMOVE_ADMIN_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const markChatAsRead = (chatId) => async (dispatch) => {
  try {
    dispatch({ type: MARK_CHAT_AS_READ });

    const response = await api.post(
      `/api/chats/${chatId}/mark-read`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );

    dispatch({
      type: MARK_CHAT_AS_READ_SUCCESS,
      payload: { chatId, response: response.data },
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: MARK_CHAT_AS_READ_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const getUnreadCount = (chatId) => async (dispatch) => {
  try {
    dispatch({ type: GET_UNREAD_COUNT });

    const response = await api.get(`/api/chats/${chatId}/unread-count`, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: GET_UNREAD_COUNT_SUCCESS,
      payload: { chatId, count: response.data },
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: GET_UNREAD_COUNT_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const checkChatAccess = (chatId) => async (dispatch) => {
  try {
    dispatch({ type: CHECK_CHAT_ACCESS });

    const response = await api.get(`/api/chats/${chatId}/has-access`, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: CHECK_CHAT_ACCESS_SUCCESS,
      payload: { chatId, hasAccess: response.data },
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: CHECK_CHAT_ACCESS_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const checkIsAdmin = (chatId) => async (dispatch) => {
  try {
    dispatch({ type: CHECK_IS_ADMIN });

    const response = await api.get(`/api/chats/${chatId}/is-admin`, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: CHECK_IS_ADMIN_SUCCESS,
      payload: { chatId, isAdmin: response.data },
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: CHECK_IS_ADMIN_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const checkIsOwner = (chatId) => async (dispatch) => {
  try {
    dispatch({ type: CHECK_IS_OWNER });

    const response = await api.get(`/api/chats/${chatId}/is-owner`, {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: CHECK_IS_OWNER_SUCCESS,
      payload: { chatId, isOwner: response.data },
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: CHECK_IS_OWNER_ERROR,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

export const setActiveChat = (chat) => ({
  type: SET_ACTIVE_CHAT,
  payload: chat,
});

export const setChatLoading = (loading) => ({
  type: SET_CHAT_LOADING,
  payload: loading,
});

export const clearChatError = () => ({
  type: CLEAR_CHAT_ERROR,
});

export const getAllUnreadCounts = () => async (dispatch) => {
  try {
    dispatch({ type: GET_ALL_UNREAD_COUNTS });

    const response = await api.get("/api/chats/unread-counts", {
      headers: getAuthHeaders(),
    });

    dispatch({
      type: GET_ALL_UNREAD_COUNTS_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: GET_ALL_UNREAD_COUNTS_ERROR,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const clearUnreadCount = (chatId) => ({
  type: CLEAR_UNREAD_COUNT,
  payload: chatId,
});

export const incrementUnreadCount = (chatId) => ({
  type: INCREMENT_UNREAD_COUNT,
  payload: chatId,
});