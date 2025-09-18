import {
  REGISTER,
  LOGIN,
  REQ_USER,
  LOGOUT,
  SEARCH_USER,
  UPDATE_USER,
  FORGOT_PASSWORD,
  RESET_PASSWORD,
  VALIDATE_TOKEN,
  SET_LOADING,
  CLEAR_LOADING,
  SET_ERROR,
  CLEAR_ERROR,
} from "./ActionType";

const initialState = {
  user: null,
  jwt: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  searchResults: [],
  passwordReset: {
    emailSent: false,
    tokenValid: false,
    resetSuccess: false,
  },
};

export const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case REGISTER:
    case LOGIN:
      return {
        ...state,
        user: action.payload.user,
        jwt: action.payload.jwt,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case REQ_USER:
      return {
        ...state,
        user: action.payload.user || action.payload,
        jwt: action.payload.jwt || localStorage.getItem("token"),
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case LOGOUT:
      return {
        ...initialState,
        passwordReset: initialState.passwordReset,
      };

    case SEARCH_USER:
      return {
        ...state,
        searchResults: action.payload,
        isLoading: false,
        error: null,
      };

    case UPDATE_USER:
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        error: null,
      };

    case FORGOT_PASSWORD:
      return {
        ...state,
        passwordReset: {
          ...state.passwordReset,
          emailSent: true,
        },
        isLoading: false,
        error: null,
      };

    case VALIDATE_TOKEN:
      return {
        ...state,
        passwordReset: {
          ...state.passwordReset,
          tokenValid: action.payload.success,
        },
        isLoading: false,
        error: null,
      };

    case RESET_PASSWORD:
      return {
        ...state,
        passwordReset: {
          ...state.passwordReset,
          resetSuccess: action.payload.success,
        },
        isLoading: false,
        error: null,
      };

    case SET_LOADING:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case CLEAR_LOADING:
      return {
        ...state,
        isLoading: false,
      };

    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};
