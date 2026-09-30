import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const ProtectedRoute = () => {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="dashboard-loading" role="status">Restoring your session...</div>;
  }

  if (user) {
    return <Outlet />;
  }

  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
