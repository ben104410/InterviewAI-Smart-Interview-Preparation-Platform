
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Interview = () => {
  const navigate = useNavigate();

  const [started, setStarted] = useState(false);
  const [role, setRole] = useState("");
  const [interviewId, setInterviewId] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startInterview = async () => {
    if (!role.trim()) {
      setError("Please enter the job role.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/interviews/start/", {
        role: role.trim(),
      });

      setInterviewId(response.data.interview_id ?? response.data.id ?? null);
      setQuestion(response.data.question);
      setStarted(true);
      setAnswer("");
      setFeedback("");
      setScore(null);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Unable to start interview."
      );
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      setError("Please enter your answer.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!interviewId) {
        throw new Error("Interview session is missing. Please start again.");
      }

      const response = await api.post("/interviews/chat/", {
        interview_id: interviewId,
        answer,
      });

      setFeedback(response.data.feedback);
      setScore(response.data.current_score ?? response.data.score ?? null);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Unable to evaluate your answer."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetInterview = () => {
    setStarted(false);
    setRole("");
    setInterviewId(null);
    setQuestion("");
    setAnswer("");
    setFeedback("");
    setScore(null);
    setError("");
  };

  return (
    <div className="interview-page">
      <div className="page-header">
        <div>
          <h1>AI Interview</h1>
          <p>
            Practice realistic interview questions and receive
            AI-powered feedback.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {!started ? (
        <div className="interview-start-card">
          <div className="interview-icon">AI</div>

          <h2>Start Your AI Interview</h2>

          <p>
            Enter the role you are preparing for and let InterviewAI
            generate a personalized interview question.
          </p>

          <div className="form-group">
            <label htmlFor="role">Job Role</label>

            <input
              id="role"
              type="text"
              placeholder="e.g. Django Developer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <button
            className="primary-button"
            onClick={startInterview}
            disabled={loading}
          >
            {loading ? "Starting Interview..." : "Start Interview"}
          </button>
        </div>
      ) : (
        <div className="interview-container">
          <div className="interview-main-card">
            <div className="interview-card-header">
              <div>
                <span className="role-label">Interview Role</span>
                <h2>{role}</h2>
              </div>

              <span className="ai-badge">AI Interview</span>
            </div>

            <div className="question-box">
              <span>Question</span>

              <h3>{question}</h3>
            </div>

            <div className="answer-section">
              <label htmlFor="answer">
                Your Answer
              </label>

              <textarea
                id="answer"
                rows="8"
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />

              <button
                className="primary-button"
                onClick={submitAnswer}
                disabled={loading}
              >
                {loading
                  ? "Evaluating Answer..."
                  : "Submit Answer"}
              </button>
            </div>

            {feedback && (
              <div className="feedback-section">
                <div className="feedback-header">
                  <div>
                    <span>AI Feedback</span>
                    <h2>Your Results</h2>
                  </div>

                  <div className="score-circle">
                    <strong>{score}</strong>
                    <small>/10</small>
                  </div>
                </div>

                <div className="feedback-content">
                  {feedback}
                </div>

                <div className="feedback-actions">
                  <button
                    className="primary-button"
                    onClick={resetInterview}
                  >
                    Start Another Interview
                  </button>

                  <button
                    className="secondary-button"
                    onClick={() => navigate("/history")}
                  >
                    View History
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Interview;
