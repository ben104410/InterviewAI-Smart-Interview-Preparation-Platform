import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import api, { getApiErrorMessage } from "../api";

const initialProfile = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  field_of_study: "Computer Science",
  target_role: "",
  experience_level: "Junior",
  preferred_interview_type: "Technical",
};

const Profile = () => {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/accounts/profile/");
        setProfile({ ...initialProfile, ...response.data });
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, "Unable to load your profile."));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [retryCount]);

  const updateProfile = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
    setNotice("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await api.put("/accounts/profile/", profile);
      setProfile({ ...initialProfile, ...response.data });
      setNotice("Your profile has been saved.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to save your profile. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="dashboard-loading" aria-live="polite" aria-busy="true">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p>Keep your account and interview preferences up to date.</p>
        </div>
      </div>

      {error && (
        <div className="dashboard-error" role="alert">
          {error}
          {loading ? null : (
            <button
              className="retry-button"
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
            >Retry</button>
          )}
        </div>
      )}

      {notice && <div className="profile-success" role="status">{notice}</div>}

      <form className="profile-layout profile-edit-layout" onSubmit={handleSave}>
        <div className="profile-card profile-main-card">
          <div className="profile-avatar" aria-hidden="true">
            {(profile.first_name || profile.username || "U").charAt(0).toUpperCase()}
          </div>

          <h2>
            {profile.first_name || profile.last_name
              ? `${profile.first_name} ${profile.last_name}`.trim()
              : user?.username || profile.username || "Your profile"}
          </h2>

          <p className="profile-role">{profile.target_role || "Interview Candidate"}</p>

          <label className="profile-field" htmlFor="profile-username">
            <span>Username</span>
            <input id="profile-username" value={profile.username} readOnly />
          </label>
        </div>

        <div className="profile-card profile-form-card">
          <div className="profile-form-heading">
            <div>
              <h2>Personal details</h2>
              <p>These details help tailor your interview practice.</p>
            </div>
          </div>

          <div className="profile-form-grid">
            <label className="profile-field" htmlFor="profile-name">
              <span>Full name</span>
              <input
                id="profile-name"
                name="first_name"
                autoComplete="given-name"
                placeholder="First name"
                value={profile.first_name}
                onChange={updateProfile}
              />
            </label>

            <label className="profile-field" htmlFor="profile-last-name">
              <span>Last name</span>
              <input
                id="profile-last-name"
                name="last_name"
                autoComplete="family-name"
                placeholder="Last name"
                value={profile.last_name}
                onChange={updateProfile}
              />
            </label>

            <label className="profile-field profile-field-wide" htmlFor="profile-email">
              <span>Email</span>
              <input
                id="profile-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={profile.email}
                onChange={updateProfile}
              />
            </label>

            <label className="profile-field" htmlFor="profile-study">
              <span>Education / field</span>
              <input
                id="profile-study"
                name="field_of_study"
                placeholder="Computer Science"
                value={profile.field_of_study}
                onChange={updateProfile}
              />
            </label>

            <label className="profile-field" htmlFor="profile-target-role">
              <span>Target role</span>
              <input
                id="profile-target-role"
                name="target_role"
                placeholder="Django Developer"
                value={profile.target_role}
                onChange={updateProfile}
              />
            </label>

            <label className="profile-field" htmlFor="profile-experience">
              <span>Experience level</span>
              <select
                id="profile-experience"
                name="experience_level"
                value={profile.experience_level}
                onChange={updateProfile}
              >
                <option>Student</option>
                <option>Junior</option>
                <option>Mid-level</option>
                <option>Senior</option>
              </select>
            </label>

            <label className="profile-field" htmlFor="profile-interview-type">
              <span>Preferred interview type</span>
              <select
                id="profile-interview-type"
                name="preferred_interview_type"
                value={profile.preferred_interview_type}
                onChange={updateProfile}
              >
                <option>Technical</option>
                <option>Behavioral</option>
                <option>HR</option>
                <option>Mixed</option>
              </select>
            </label>
          </div>

          <div className="profile-form-actions">
            <button className="secondary-button" type="button" onClick={handleLogout}>Log out</button>
            <button className="primary-button" type="submit" disabled={saving || loading}>
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Profile;









