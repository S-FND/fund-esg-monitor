import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (Date.now() >= payload.exp * 1000) {
      localStorage.clear();
      return <Navigate to="/" replace />;
    }
  } catch {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  return children;
}