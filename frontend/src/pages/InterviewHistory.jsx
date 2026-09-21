import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

const InterviewHistory = () => {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get("/interviews/history/");

        // Handles both a direct array and a DRF paginated response
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setInterviews(data);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.detail ||
            "Unable to load interview history."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getScoreClass = (score) => {
    const value = Number(score);

    if (value >= 8) return "score-good";
    if (value >= 5) return "score-average";

    return "score-low";
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading interview history...
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="page-header">
        <div>
          <h1>Interview History</h1>
          <p>
            Review your previous AI interview sessions and
            performance.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/interview")}
        >
          Start New Interview
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {interviews.length === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">◷</div>

          <h2>No Interview History</h2>

          <p>
            You have not completed any interviews yet.
            Start your first AI interview to see your results
            here.
          </p>

          <button
            className="primary-button"
            onClick={() => navigate("/interview")}
          >
            Start AI Interview
          </button>
        </div>
      ) : (
        <div className="history-list">
          {interviews.map((interview) => (
            <div
              className="history-card"
              key={interview.id}
            >
              <div className="history-card-top">
                <div>
                  <span className="history-label">
                    Job Role
                  </span>

                  <h2>
                    {interview.role || "Unknown Role"}
                  </h2>
                </div>

                <div
                  className={`history-score ${getScoreClass(
                    interview.score
                  )}`}
                >
                  <strong>
                    {interview.score ?? 0}
                  </strong>
                  <span>/10</span>
                </div>
              </div>

              <div className="history-question">
                <span>Question</span>

                <p>
                  {interview.question ||
                    "No question available."}
                </p>
              </div>

              {interview.answer && (
                <div className="history-answer">
                  <span>Your Answer</span>

                  <p>{interview.answer}</p>
                </div>
              )}

              {interview.feedback && (
                <div className="history-feedback">
                  <span>AI Feedback</span>

                  <p>{interview.feedback}</p>
                </div>
              )}

              <div className="history-footer">
                <span>
                  {interview.created_at
                    ? new Date(
                        interview.created_at
                      ).toLocaleString()
                    : "Date unavailable"}
                </span>

                {interview.is_followup && (
                  <span className="followup-badge">
                    Follow-up
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewHistory;
