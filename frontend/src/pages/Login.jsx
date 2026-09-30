import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../api";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");
      setSubmitting(true);
      await login(username, password);
      navigate("/dashboard");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to sign in. Please check your details and try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>InterviewAI</h1>
        <p>Sign in to your account</p>

        {error && <div className="error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="login-username">Username</label>
          <input
            id="login-username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <label className="visually-hidden" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p>
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="link"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
