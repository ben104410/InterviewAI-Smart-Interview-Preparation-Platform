import { useState } from "react";
import api from "../api";

const ResumeAnalysis = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    setError("");
    setAnalysis(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF or Word document.");
      setFile(null);
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      setError("File size must be less than 100MB.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const analyzeResume = async () => {
    if (!file) {
      setError("Please select a resume first.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await api.post(
        "/resumes/upload/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setAnalysis(response.data.analysis ?? response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Unable to analyze your resume."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setAnalysis(null);
    setError("");

    const input = document.getElementById("resume-upload");

    if (input) {
      input.value = "";
    }
  };

  return (
    <div className="resume-page">
      <div className="page-header">
        <div>
          <h1>Resume Analysis</h1>

          <p>
            Upload your resume and let AI analyze your
            skills, experience, and career profile.
          </p>
        </div>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {!analysis && (
        <div className="resume-upload-card">
          <div className="resume-upload-icon">
            CV
          </div>

          <h2>Analyze Your Resume</h2>

          <p>
            Upload your CV in PDF or Word format. InterviewAI
            will analyze the content and provide useful
            feedback.
          </p>

          <label
            htmlFor="resume-upload"
            className="upload-area"
          >
            <div className="upload-icon">
              ↑
            </div>

            <strong>
              {file
                ? file.name
                : "Click to select your resume"}
            </strong>

            <span>
              PDF or DOCX • Maximum 100MB
            </span>

            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
          </label>

          {file && (
            <div className="selected-file">
              <div>
                <strong>{file.name}</strong>

                <span>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              <button
                type="button"
                onClick={resetAnalysis}
              >
                Remove
              </button>
            </div>
          )}

          <button
            className="primary-button resume-analyze-button"
            onClick={analyzeResume}
            disabled={!file || loading}
          >
            {loading
              ? "Analyzing Resume..."
              : "Analyze Resume"}
          </button>

          {loading && (
            <p className="analysis-loading-text">
              AI is reviewing your resume. This may take
              a few moments...
            </p>
          )}
        </div>
      )}

      {analysis && (
        <div className="resume-results">
          <div className="results-header">
            <div>
              <span>AI ANALYSIS</span>

              <h2>Resume Analysis Results</h2>

              {file && <p>{file.name}</p>}
            </div>

            <button
              className="secondary-button"
              onClick={resetAnalysis}
            >
              Analyze Another Resume
            </button>
          </div>

          <div className="analysis-grid">
            {analysis.score !== undefined && (
              <div className="analysis-score-card">
                <span>Resume Score</span>

                <strong>
                  {analysis.score}
                </strong>

                <small>/10</small>
              </div>
            )}

            {analysis.summary && (
              <div className="analysis-card">
                <h3>Summary</h3>

                <p>{analysis.summary}</p>
              </div>
            )}

            {analysis.strengths && (
              <div className="analysis-card">
                <h3>Strengths</h3>

                <div className="analysis-text">
                  {Array.isArray(analysis.strengths)
                    ? analysis.strengths.map(
                        (strength, index) => (
                          <div
                            className="analysis-item"
                            key={index}
                          >
                            <span>✓</span>
                            <p>{strength}</p>
                          </div>
                        )
                      )
                    : <p>{analysis.strengths}</p>}
                </div>
              </div>
            )}

            {analysis.weaknesses && (
              <div className="analysis-card">
                <h3>Areas for Improvement</h3>

                <div className="analysis-text">
                  {Array.isArray(analysis.weaknesses)
                    ? analysis.weaknesses.map(
                        (weakness, index) => (
                          <div
                            className="analysis-item"
                            key={index}
                          >
                            <span>!</span>
                            <p>{weakness}</p>
                          </div>
                        )
                      )
                    : <p>{analysis.weaknesses}</p>}
                </div>
              </div>
            )}

            {analysis.skills && (
              <div className="analysis-card">
                <h3>Skills</h3>

                <div className="skills-list">
                  {Array.isArray(analysis.skills)
                    ? analysis.skills.map(
                        (skill, index) => (
                          <span
                            className="skill-tag"
                            key={index}
                          >
                            {skill}
                          </span>
                        )
                      )
                    : <p>{analysis.skills}</p>}
                </div>
              </div>
            )}

            {analysis.recommendations && (
              <div className="analysis-card full-width">
                <h3>Recommendations</h3>

                <div className="analysis-text">
                  {Array.isArray(
                    analysis.recommendations
                  )
                    ? analysis.recommendations.map(
                        (recommendation, index) => (
                          <div
                            className="analysis-item"
                            key={index}
                          >
                            <span>→</span>
                            <p>{recommendation}</p>
                          </div>
                        )
                      )
                    : (
                        <p>
                          {analysis.recommendations}
                        </p>
                      )}
                </div>
              </div>
            )}

            {!analysis.summary &&
              !analysis.strengths &&
              !analysis.weaknesses &&
              !analysis.skills &&
              !analysis.recommendations && (
                <div className="analysis-card full-width">
                  <h3>Analysis</h3>

                  <p>
                    {typeof analysis === "string"
                      ? analysis
                      : JSON.stringify(
                          analysis,
                          null,
                          2
                        )}
                  </p>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysis;
