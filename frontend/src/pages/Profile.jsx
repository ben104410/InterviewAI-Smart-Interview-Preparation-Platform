import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from  "../api";

const Profile = () => {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState({
    username: user?.username || "",
    email: "",
    first_name: "",
    last_name: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        /*
          For now we use the dashboard endpoint because
          your backend already exposes the authenticated user.
        */
        const response = await api.get("/accounts/dashboard/");

        setProfile({
          username: response.data.username || "",
          email: response.data.email || "",
          first_name: response.data.first_name || "",
          last_name: response.data.last_name || "",
        });
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.detail ||
            "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p>
            View your InterviewAI account information.
          </p>
        </div>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      <div className="profile-layout">
        <div className="profile-card profile-main-card">
          <div className="profile-avatar">
            {profile.username
              ? profile.username
                  .charAt(0)
                  .toUpperCase()
              : "U"}
          </div>

          <h2>
            {profile.first_name || profile.last_name
              ? `${profile.first_name} ${profile.last_name}`.trim()
              : profile.username || "User"}
          </h2>

          <p className="profile-role">
            Interview Candidate
          </p>

          <div className="profile-divider"></div>

          <div className="profile-info">
            <div>
              <span>Username</span>
              <strong>
                {profile.username || "Not available"}
              </strong>
            </div>

            <div>
              <span>Email</span>
              <strong>
                {profile.email || "Not available"}
              </strong>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <h2>Account Information</h2>

          <div className="account-info-list">
            <div className="account-info-item">
              <span>Account Status</span>

              <strong className="status-active">
                Active
              </strong>
            </div>

            <div className="account-info-item">
              <span>Account Type</span>

              <strong>Candidate</strong>
            </div>

            <div className="account-info-item">
              <span>Platform</span>

              <strong>InterviewAI</strong>
            </div>
          </div>

          <div className="profile-actions">
            <button
              className="logout-profile-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;









