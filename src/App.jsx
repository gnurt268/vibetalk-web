import "./App.css";
import { Route, Routes, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { currentUser } from "./redux/Auth/Action";
import HomePage from "./components/HomePage.jsx";
import Status from "./components/Status/Status.jsx";
import Login from "./components/auth/Login.jsx";
import Register from "./components/auth/Register.jsx";
import ForgotPassword from "./components/auth/ForgotPassword.jsx";
import ResetPassword from "./components/auth/ResetPassword.jsx";

const ProtectedRoute = ({ children }) => {
  const { auth } = useSelector((store) => store);
  const token = localStorage.getItem("token");

  return auth?.user || token ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { auth } = useSelector((store) => store);
  const token = localStorage.getItem("token");

  return auth?.user || token ? <Navigate to="/" replace /> : children;
};

function App() {
  const dispatch = useDispatch();
  const { auth } = useSelector((store) => store);

  useEffect(() => {
    const initializeUser = async () => {
      const token = localStorage.getItem("token");

      if (token && !auth?.user) {
        try {
          const result = await dispatch(currentUser(token));
        } catch (error) {
          console.error("Failed to initialize user:", error);

          if (error.response?.status === 401) {
            localStorage.removeItem("token");
          }
        }
      } else if (token && auth?.user) {
      } else {
        console.error("No token found, user needs to login");
      }
    };

    initializeUser();
  }, [dispatch, auth?.user]);

  return (
    <div>
      <Routes>
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stories"
          element={
            <ProtectedRoute>
              <Status />
            </ProtectedRoute>
          }
        />

        {/* Public/Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
