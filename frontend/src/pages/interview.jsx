import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getAiServiceErrorMessage } from "../api";

const TOTAL_QUESTIONS = 3;

const Interview = () => {
  const navigate = useNavigate();

  const [started, setStarted] = useState(false);
  const [role, setRole] = useState("");
  const [interviewId, setInterviewId] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [sessionScores, setSessionScores] = useState([]);
  const [pendingNextQuestion, setPendingNextQuestion] = useState(null);
  const [pendingNextInterviewId, setPendingNextInterviewId] = useState(null);
  const [showNextQuestion, setShowNextQuestion] = useState(false);
  const [finalSummary, setFinalSummary] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finalizeSession = (latestScores) => {
    const totalScore = latestScores.reduce((sum, value) => sum + value, 0);
    const averageScore = latestScores.length
      ? (totalScore / latestScores.length).toFixed(1)
      : "0.0";

    setFinalSummary({
      totalScore,
      averageScore,
      answeredQuestions: latestScores.length,
      totalQuestions: TOTAL_QUESTIONS,
    });

    setFeedback("");
    setScore(null);
    setAnswer("");
    setQuestion("");
    setPendingNextQuestion(null);
    setPendingNextInterviewId(null);
    setShowNextQuestion(false);
  };

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
      setCurrentQuestionNumber(1);
      setAnswer("");
      setFeedback("");
      setScore(null);
      setSessionScores([]);
      setPendingNextQuestion(null);
      setPendingNextInterviewId(null);
      setShowNextQuestion(false);
      setFinalSummary(null);
    } catch (err) {
      console.error(err);
      setError(getAiServiceErrorMessage(err, "Unable to connect to the AI service.\n\nPlease try again in a moment."));
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

      const currentValue = Number(
        response.data.current_score ?? response.data.score ?? 0
      );

      const updatedScores = [...sessionScores, currentValue];

      setSessionScores(updatedScores);
      setFeedback(response.data.feedback);
      setScore(currentValue);

      const nextQuestion = response.data.followup_question || null;

      if (!nextQuestion || currentQuestionNumber >= TOTAL_QUESTIONS) {
        finalizeSession(updatedScores);
        return;
      }

      setPendingNextQuestion(nextQuestion);
      setPendingNextInterviewId(response.data.followup_id ?? interviewId);
      setShowNextQuestion(true);
    } catch (err) {
      console.error(err);
      setError(getAiServiceErrorMessage(err, "Unable to connect to the AI service.\n\nPlease try again in a moment."));
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (!pendingNextQuestion) {
      finalizeSession(sessionScores);
      return;
    }

    setQuestion(pendingNextQuestion);
    setInterviewId(pendingNextInterviewId ?? interviewId);
    setAnswer("");
    setFeedback("");
    setScore(null);
    setPendingNextQuestion(null);
    setPendingNextInterviewId(null);
    setShowNextQuestion(false);
    setCurrentQuestionNumber((previous) => previous + 1);
  };

  const resetInterview = () => {
    setStarted(false);
    setRole("");
    setInterviewId(null);
    setQuestion("");
    setAnswer("");
    setFeedback("");
    setScore(null);
    setCurrentQuestionNumber(1);
    setSessionScores([]);
    setPendingNextQuestion(null);
    setPendingNextInterviewId(null);
    setShowNextQuestion(false);
    setFinalSummary(null);
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
            {loading ? "AI is generating your question..." : "Start Interview"}
          </button>

          {loading && <p className="analysis-loading-text">Loading...</p>}
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

            {!finalSummary && (
              <>
                <div className="question-box">
                  <span>
                    Question {currentQuestionNumber} of {TOTAL_QUESTIONS}
                  </span>

                  <h3>{question}</h3>
                </div>

                <div className="answer-section">
                  <label htmlFor="answer">Your Answer</label>

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
                    {loading ? "AI is evaluating your answer..." : "Submit Answer"}
                  </button>

                  {loading && <p className="analysis-loading-text">Loading...</p>}
                </div>
              </>
            )}

            {feedback && !finalSummary && (
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

                <div className="feedback-content">{feedback}</div>

                <div className="feedback-actions">
                  {showNextQuestion ? (
                    <button
                      className="primary-button"
                      onClick={handleNextQuestion}
                      disabled={loading}
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      className="primary-button"
                      onClick={resetInterview}
                    >
                      Start Another Interview
                    </button>
                  )}

                  <button
                    className="secondary-button"
                    onClick={() => navigate("/history")}
                  >
                    View History
                  </button>
                </div>
              </div>
            )}

            {finalSummary && (
              <div className="feedback-section">
                <div className="feedback-header">
                  <div>
                    <span>Interview Summary</span>
                    <h2>Final Results</h2>
                  </div>

                  <div className="score-circle">
                    <strong>{finalSummary.averageScore}</strong>
                    <small>/10</small>
                  </div>
                </div>

                <div className="feedback-content">
                  <p>
                    You answered {finalSummary.answeredQuestions} out of {finalSummary.totalQuestions} questions.
                  </p>
                  <p>
                    Total score: {finalSummary.totalScore} / {finalSummary.totalQuestions * 10}
                  </p>
                  <p>
                    Average score: {finalSummary.averageScore} / 10
                  </p>
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
