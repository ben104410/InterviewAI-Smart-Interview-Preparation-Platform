import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="navbar-logo">
        <span className="logo-icon">IA</span>

        <div>
          <h2>InterviewAI</h2>
          <span>Smart Interview Preparation</span>
        </div>
      </div>

      <div className="navbar-right">
        <div className="user-info">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>

          <div>
            <strong>{user?.username || "User"}</strong>
            <small>Candidate</small>
          </div>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
