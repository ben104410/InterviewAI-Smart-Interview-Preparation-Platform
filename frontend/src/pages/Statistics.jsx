import { useEffect, useState } from "react";
import api from "../api";

const Statistics = () => {
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
    const fetchStatistics = async () => {
      try {
        const response = await api.get("/interviews/stats/");
        setStats(response.data);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.detail ||
            "Unable to load statistics."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading statistics...
      </div>
    );
  }

  const average = Number(stats.average_score) || 0;
  const highest = Number(stats.highest_score) || 0;
  const lowest = Number(stats.lowest_score) || 0;

  return (
    <div className="statistics-page">
      <div className="page-header">
        <div>
          <h1>Statistics</h1>
          <p>
            Track your interview performance and identify
            areas for improvement.
          </p>
        </div>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {/* Summary Cards */}
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
            <h2>{average.toFixed(1)}/10</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">↑</div>

          <div>
            <p>Highest Score</p>
            <h2>{highest}/10</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">↓</div>

          <div>
            <p>Lowest Score</p>
            <h2>{lowest}/10</h2>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="statistics-card">
        <div className="statistics-card-header">
          <div>
            <h2>Performance by Role</h2>
            <p>
              Compare your interview results across different
              job roles.
            </p>
          </div>
        </div>

        {stats.role_performance.length === 0 ? (
          <div className="statistics-empty">
            <div>◌</div>

            <h3>No Performance Data</h3>

            <p>
              Complete some AI interviews to see your
              performance statistics.
            </p>
          </div>
        ) : (
          <div className="performance-list">
            {stats.role_performance.map((role, index) => {
              const roleScore = Number(role.avg) || 0;
              const percentage = Math.min(
                roleScore * 10,
                100
              );

              return (
                <div
                  className="performance-row"
                  key={`${role.role}-${index}`}
                >
                  <div className="performance-info">
                    <div>
                      <strong>{role.role}</strong>

                      <span>
                        {role.count} interview
                        {role.count !== 1
                          ? "s"
                          : ""}
                      </span>
                    </div>

                    <strong>
                      {roleScore.toFixed(1)}/10
                    </strong>
                  </div>

                  <div className="performance-bar">
                    <div
                      className="performance-bar-fill"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Score Interpretation */}
      <div className="statistics-grid">
        <div className="statistics-card">
          <h2>Score Overview</h2>

          <div className="score-overview">
            <div className="score-overview-item">
              <span className="score-dot high"></span>

              <div>
                <strong>8 - 10</strong>
                <p>Strong performance</p>
              </div>
            </div>

            <div className="score-overview-item">
              <span className="score-dot medium"></span>

              <div>
                <strong>5 - 7.9</strong>
                <p>Room for improvement</p>
              </div>
            </div>

            <div className="score-overview-item">
              <span className="score-dot low"></span>

              <div>
                <strong>0 - 4.9</strong>
                <p>Needs more preparation</p>
              </div>
            </div>
          </div>
        </div>

        <div className="statistics-card">
          <h2>Preparation Insight</h2>

          {stats.total_interviews === 0 ? (
            <p className="insight-text">
              Complete your first AI interview to receive
              performance insights.
            </p>
          ) : (
            <p className="insight-text">
              You have completed{" "}
              <strong>
                {stats.total_interviews}
              </strong>{" "}
              interview
              {stats.total_interviews !== 1
                ? "s"
                : ""}{" "}
              with an average score of{" "}
              <strong>
                {average.toFixed(1)}/10
              </strong>
              . Continue practicing to improve your
              consistency and interview performance.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
