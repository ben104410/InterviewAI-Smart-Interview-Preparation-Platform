import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getApiErrorMessage } from "../api";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setError("");
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setSubmitting(true);

      await api.post("/accounts/register/", formData);

      navigate("/");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Registration failed. Please check your details and try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Account</h1>

        <p>Start preparing for your next interview.</p>

        {error && <div className="error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="register-username">Username</label>
          <input
            id="register-username"
            name="username"
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <label className="visually-hidden" htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label className="visually-hidden" htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p>
          Already have an account?{" "}
          <button
            type="button"
            className="link"
            onClick={() => navigate("/")}
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;