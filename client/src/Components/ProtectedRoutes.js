import { useContext } from "react";
import { UserContext } from "../context/userContext";
import { Navigate } from "react-router-dom";
import LoadingScreen from "./LoadingScreen";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return <LoadingScreen message="Preparing your dashboard" ariaLabel="Loading your dashboard" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
