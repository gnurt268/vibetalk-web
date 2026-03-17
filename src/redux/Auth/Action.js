import api from "../../config/api";
import cryptoService from "../../services/CryptoService";
import {
  REGISTER,
  LOGIN,
  REQ_USER,
  SEARCH_USER,
  UPDATE_USER,
  LOGOUT,
  FORGOT_PASSWORD,
  RESET_PASSWORD,
  VALIDATE_TOKEN,
  CHANGE_PASSWORD,
  UPLOAD_AVATAR,
} from "./ActionType";

/**
 * Generate E2EE key pair
 */
const setupE2EEKeys = async (token) => {
  try {
    if (!cryptoService.hasKeyPair()) {
      const { publicKeyJwk } = await cryptoService.generateKeyPair();
      await api.put(
        "/api/users/public-key",
        { publicKey: publicKeyJwk },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } else {
      const publicKey = cryptoService.getStoredPublicKey();
      await api.put(
        "/api/users/public-key",
        { publicKey },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    }
  } catch (error) {
    console.error("[E2EE] Failed to setup keys:", error);
  }
};

export const register = (data) => async (dispatch) => {
  try {
    const response = await api.post("/auth/register", data);
    const resData = response.data;

    if (resData.jwt) {
      localStorage.setItem("token", resData.jwt);
      await setupE2EEKeys(resData.jwt);
    }
    dispatch({ type: REGISTER, payload: resData });
    return resData;
  } catch (error) {
    console.error("error register: ", error.response?.data || error.message);
    throw error;
  }
};

export const login = (data) => async (dispatch) => {
  try {
    const response = await api.post("/auth/login", data);
    const resData = response.data;

    if (resData.jwt) {
      localStorage.setItem("token", resData.jwt);
      await setupE2EEKeys(resData.jwt);
    }
    dispatch({ type: LOGIN, payload: resData });
    return resData;
  } catch (error) {
    console.error("error login: ", error.response?.data || error.message);
    throw error;
  }
};

export const currentUser = (token) => async (dispatch) => {
  try {
    const response = await api.get("/api/users/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const resData = response.data;

    dispatch({ type: REQ_USER, payload: { user: resData, jwt: token } });

    await setupE2EEKeys(token);

    return resData;
  } catch (error) {
    console.error(
      "error get current user: ",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const searchUser = (data, token) => async (dispatch) => {
  try {
    const response = await api.get(`/api/users/search/${data.keyword}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const resData = response.data;

    dispatch({ type: SEARCH_USER, payload: resData });
    return resData;
  } catch (error) {
    console.error("error search user: ", error.response?.data || error.message);
    throw error;
  }
};

export const updateUser = (data, token) => async (dispatch) => {
  try {
    const response = await api.put(`/api/users/update`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const resData = response.data;

    const updatedUserResponse = await api.get("/api/users/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    dispatch({ type: UPDATE_USER, payload: updatedUserResponse.data });
    return resData;
  } catch (error) {
    console.error("error update user: ", error.response?.data || error.message);
    throw error;
  }
};

export const changePassword = (data, token) => async (dispatch) => {
  try {
    const response = await api.post("/api/users/change-password", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const resData = response.data;

    dispatch({ type: CHANGE_PASSWORD, payload: resData });
    return resData;
  } catch (error) {
    console.error(
      "error change password: ",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const uploadAvatar = (file, token) => async (dispatch) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/api/users/upload-avatar", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    const resData = response.data;

    dispatch({ type: UPLOAD_AVATAR, payload: resData });
    return resData;
  } catch (error) {
    console.error(
      "error upload avatar: ",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const uploadAvatarBase64 = (base64Image, token) => async (dispatch) => {
  try {
    const response = await api.post(
      "/api/users/upload-avatar-base64",
      { image: base64Image },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const resData = response.data;

    dispatch({ type: UPLOAD_AVATAR, payload: resData });
    return resData;
  } catch (error) {
    console.error(
      "error upload avatar base64: ",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const logout = () => async (dispatch) => {
  try {
    localStorage.removeItem("token");
    dispatch({ type: LOGOUT, payload: null });
  } catch (error) {
    console.error("error logout: ", error);
    throw error;
  }
};

export const forgotPassword = (email) => async (dispatch) => {
  try {
    const response = await api.post("/auth/password/forgot", { email });
    const resData = response.data;

    dispatch({ type: FORGOT_PASSWORD, payload: resData });
    return resData;
  } catch (error) {
    console.error(
      "error forgot password: ",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const resetPassword = (data) => async (dispatch) => {
  try {
    const response = await api.post("/auth/password/reset", data);
    const resData = response.data;

    dispatch({ type: RESET_PASSWORD, payload: resData });
    return resData;
  } catch (error) {
    console.error(
      "error reset password: ",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const validateResetToken = (token) => async (dispatch) => {
  try {
    const response = await api.post("/auth/password/validate-token", { token });
    const resData = response.data;

    dispatch({ type: VALIDATE_TOKEN, payload: resData });
    return resData;
  } catch (error) {
    console.error(
      "error validate token: ",
      error.response?.data || error.message,
    );
    throw error;
  }
};
