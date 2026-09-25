import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Dashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_interviews: 0,
    average_score: 0,
    highest_score: 0,
    lowest_score: 0,
    role_performance: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/interviews/stats/");

        setStats(response.data);
      } catch (error) {
        console.error(error);
        setError("Unable to load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard">

      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>

          <p>
            Track your interview preparation and improve your
            performance.
          </p>
        </div>

        <button
          className="start-interview-btn"
          onClick={() => navigate("/interview")}
        >
          Start AI Interview
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon">◉</div>

          <div>
            <p>Total Interviews</p>
            <h2>{stats.total_interviews}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">★</div>

          <div>
            <p>Average Score</p>
            <h2>{stats.average_score}/10</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">↑</div>

          <div>
            <p>Highest Score</p>
            <h2>{stats.highest_score}/10</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">↓</div>

          <div>
            <p>Lowest Score</p>
            <h2>{stats.lowest_score}/10</h2>
          </div>
        </div>

      </div>

      <div className="dashboard-grid">

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Performance by Role</h2>
              <p>Your interview performance across different roles.</p>
            </div>
          </div>

          {stats.role_performance.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◌</div>

              <h3>No interview data yet</h3>

              <p>
                Start your first AI interview to see your
                performance here.
              </p>
            </div>
          ) : (
            <div className="role-list">
              {stats.role_performance.map((role) => (
                <div
                  className="role-item"
                  key={role.role}
                >
                  <div>
                    <strong>{role.role}</strong>
                    <span>
                      {role.count} interview
                      {role.count !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <strong>
                    {Number(role.avg).toFixed(1)}/10
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-card quick-actions">

          <h2>Quick Actions</h2>

          <button onClick={() => navigate("/interview")}>
            <span>◉</span>
            Start AI Interview
          </button>

          <button onClick={() => navigate("/resume")}>
            <span>▤</span>
            Analyze Resume
          </button>

          <button onClick={() => navigate("/statistics")}>
            <span>▥</span>
            View Statistics
          </button>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;