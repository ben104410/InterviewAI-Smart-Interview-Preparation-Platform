import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const localDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const scoreOutOfTen = (score) => {
  const value = Number(score);
  if (!Number.isFinite(value)) return 0;
  return Math.min(10, Math.max(0, value > 10 ? value / 10 : value));
};

const buildActivity = (interviews, range) => {
  const today = new Date();

  if (range === "monthly") {
    return Array.from({ length: 6 }, (_, index) => {
      const month = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
      const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
      return {
        key,
        label: month.toLocaleDateString(undefined, { month: "short" }),
        count: interviews.filter((interview) => {
          const date = new Date(interview.created_at);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` === key;
        }).length,
      };
    });
  }

  const currentWeek = new Date(today);
  currentWeek.setHours(0, 0, 0, 0);
  currentWeek.setDate(currentWeek.getDate() - ((currentWeek.getDay() + 6) % 7));

  return Array.from({ length: 8 }, (_, index) => {
    const week = new Date(currentWeek);
    week.setDate(week.getDate() - (7 * (7 - index)));
    const key = localDateKey(week);
    return {
      key,
      label: week.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: interviews.filter((interview) => {
        const date = new Date(interview.created_at);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
        return localDateKey(date) === key;
      }).length,
    };
  });
};

const buildTimeline = (interviews) => {
  let runningScore = 0;
  return [...interviews]
    .filter((interview) => interview.created_at)
    .sort((first, second) => new Date(first.created_at) - new Date(second.created_at))
    .map((interview, index) => {
      const score = scoreOutOfTen(interview.score);
      runningScore += score;
      return {
        index: index + 1,
        average: runningScore / (index + 1),
        date: new Date(interview.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      };
    });
};

const buildLearningPlan = (records) => {
  const recent = (records || [])
    .filter((interview) => !interview.is_followup && interview.answer?.trim())
    .slice(0, 8);

  if (!recent.length) {
    return {
      summary: "Complete a few interviews to generate your AI learning plan.",
      topics: [],
      recommended_next_steps: [],
    };
  }

  const grouped = recent.reduce((accumulator, interview) => {
    const focusArea = (interview.focus_area || "General interview fundamentals").trim() || "General interview fundamentals";
    if (!accumulator[focusArea]) {
      accumulator[focusArea] = [];
    }
    accumulator[focusArea].push(Number(interview.score || 0));
    return accumulator;
  }, {});

  const topics = Object.entries(grouped)
    .map(([name, scores]) => ({
      name,
      confidence: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      count: scores.length,
    }))
    .sort((first, second) => first.confidence - second.confidence)
    .slice(0, 3);

  const recommendationMap = {
    "rest apis": "Practice 5 REST API questions",
    "database optimization": "Review Django ORM optimization",
    "system design": "Attempt a system-design interview",
    "communication": "Practice 5 STAR-format answers",
    "leadership": "Prepare 3 leadership stories with measurable impact",
    "problem solving": "Walk through 3 debugging-heavy scenario answers",
  };

  return {
    summary: `Based on your last ${recent.length} interviews:`,
    topics,
    recommended_next_steps: topics.map((topic) => recommendationMap[topic.name.toLowerCase()] || `Review ${topic.name} with 3 focused drills`),
  };
};

const Statistics = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState({ learning_plan: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activityRange, setActivityRange] = useState("weekly");

  const recentInterviews = [
    { name: "Django Developer", score: "8.7/10" },
    { name: "React Developer", score: "7.9/10" },
    { name: "Python Developer", score: "8.1/10" },
  ];

  const recommendedItems = [
    "Practice Django ORM",
    "Take a technical interview",
    "Improve your resume",
  ];

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const [statsResponse, historyResponse] = await Promise.all([
          api.get("/interviews/stats/"),
          api.get("/interviews/history/"),
        ]);

        const records = Array.isArray(historyResponse.data)
          ? historyResponse.data
          : historyResponse.data.results || [];

        setStats(statsResponse.data || { learning_plan: null });
        setInterviews(records.filter((interview) => !interview.is_followup));
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || "Unable to load statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Loading statistics...</div>;
  }

  const completed = interviews.filter((interview) => Boolean(interview.answer?.trim()));
  const average = completed.length
    ? completed.reduce((sum, interview) => sum + scoreOutOfTen(interview.score), 0) / completed.length
    : 0;
  const completionRate = interviews.length ? Math.round((completed.length / interviews.length) * 100) : 0;
  const timeline = buildTimeline(completed);

  const roleScores = Object.values(completed.reduce((groups, interview) => {
    const role = interview.role || "Unspecified role";
    groups[role] ??= { name: role, total: 0, count: 0 };
    groups[role].total += scoreOutOfTen(interview.score);
    groups[role].count += 1;
    return groups;
  }, {})).map((role) => ({ ...role, average: role.total / role.count }))
    .sort((first, second) => second.average - first.average);

  const topicScores = Object.values(completed.reduce((groups, interview) => {
    const topic = interview.focus_area?.trim();
    if (!topic) return groups;
    groups[topic] ??= { name: topic, total: 0, count: 0 };
    groups[topic].total += scoreOutOfTen(interview.score);
    groups[topic].count += 1;
    return groups;
  }, {})).map((topic) => ({ ...topic, average: topic.total / topic.count }))
    .sort((first, second) => first.average - second.average);

  const weakestRole = roleScores.length ? roleScores[roleScores.length - 1] : null;
  const bestRole = roleScores[0] || null;
  const weakestTopic = topicScores[0] || null;
  const activity = buildActivity(interviews.filter((interview) => interview.created_at), activityRange);
  const learningPlan = stats.learning_plan || buildLearningPlan(interviews);
  const chartWidth = 760;
  const chartHeight = 250;
  const chartPadding = { top: 18, right: 16, bottom: 38, left: 34 };
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const chartPoints = timeline.map((point, index) => ({
    ...point,
    x: chartPadding.left + (timeline.length > 1 ? (index / (timeline.length - 1)) * plotWidth : plotWidth / 2),
    y: chartPadding.top + ((10 - point.average) / 10) * plotHeight,
  }));
  const linePath = chartPoints.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const maxActivity = Math.max(1, ...activity.map((item) => item.count));

  return (
    <div className="statistics-page">
      <div className="interview-summary-shell">
        <div className="interview-summary-header">
          <div className="welcome-copy">
            <p className="welcome-label">Good afternoon, Benjamin 👋</p>
            <h2>Ready for your next interview?</h2>
          </div>
          <button className="start-interview-btn compact" onClick={() => navigate("/interview")}>
            Start AI Interview
          </button>
        </div>

        <div className="performance-summary-panel">
          <div className="performance-summary-copy">
            <span className="panel-label">INTERVIEW PERFORMANCE</span>
            <div className="score-line">
              <strong>8.2</strong>
              <span>/10</span>
            </div>
            <p>Average Score</p>
          </div>

          <div className="summary-metrics">
            <div className="summary-metric">
              <strong>12</strong>
              <span>Interviews</span>
            </div>
            <div className="summary-metric">
              <strong>82%</strong>
              <span>Resume Score</span>
            </div>
            <div className="summary-metric">
              <strong>+14%</strong>
              <span>Improvement</span>
            </div>
          </div>
        </div>

        <div className="summary-panels-grid">
          <article className="summary-panel">
            <h3>Recent Interviews</h3>
            <ul>
              {recentInterviews.map((item) => (
                <li key={item.name}>
                  <span>{item.name}</span>
                  <strong>{item.score}</strong>
                </li>
              ))}
            </ul>
          </article>

          <article className="summary-panel">
            <h3>RECOMMENDED FOR YOU</h3>
            <p>Based on your performance:</p>
            <ul className="recommend-list">
              {recommendedItems.map((item) => (
                <li key={item}>→ {item}</li>
              ))}
            </ul>
          </article>
        </div>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      <section className="stats-grid" aria-label="Interview summary">
        <article className="stat-card"><span className="stat-card-label">Interviews</span><strong>{interviews.length}</strong><span className="stat-card-detail">Main sessions started</span></article>
        <article className="stat-card"><span className="stat-card-label">Average score</span><strong>{average.toFixed(1)}<small>/10</small></strong><span className="stat-card-detail">Across {completed.length} completed</span></article>
        <article className="stat-card"><span className="stat-card-label">Completion rate</span><strong>{completionRate}<small>%</small></strong><span className="stat-card-detail">Answered sessions</span></article>
        <article className="stat-card"><span className="stat-card-label">Best performing role</span><strong className="stat-card-role">{bestRole?.name || "Not enough data"}</strong><span className="stat-card-detail">{bestRole ? `${bestRole.average.toFixed(1)}/10 average` : "Complete an interview to compare roles"}</span></article>
      </section>

      <section className="statistics-chart-grid">
        <article className="statistics-card statistics-chart-card">
          <div className="statistics-card-header">
            <div><h2>Average score over time</h2><p>Cumulative average across completed interviews.</p></div>
            <span className="chart-unit">Score / 10</span>
          </div>
          {chartPoints.length ? (
            <div className="line-chart-wrap">
              <svg className="statistics-line-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Interview scores over time">
                {[0, 2.5, 5, 7.5, 10].map((tick) => {
                  const y = chartPadding.top + ((10 - tick) / 10) * plotHeight;
                  return <g key={tick}><line x1={chartPadding.left} x2={chartWidth - chartPadding.right} y1={y} y2={y} className="chart-grid-line" /><text x={chartPadding.left - 10} y={y + 4} textAnchor="end" className="chart-axis-label">{tick}</text></g>;
                })}
                {chartPoints.length > 1 && <path d={linePath} className="chart-line" />}
                {chartPoints.map((point) => <g key={`${point.index}-${point.date}`}><circle cx={point.x} cy={point.y} r="5" className="chart-point"><title>{`Average after interview ${point.index}: ${point.average.toFixed(1)}/10 on ${point.date}`}</title></circle></g>)}
                {chartPoints.filter((_, index) => index === 0 || index === chartPoints.length - 1 || index === Math.floor(chartPoints.length / 2)).map((point) => <text key={`label-${point.index}`} x={point.x} y={chartHeight - 9} textAnchor="middle" className="chart-axis-label">{point.date}</text>)}
              </svg>
            </div>
          ) : <div className="statistics-empty"><h3>No performance data yet</h3><p>Complete an interview to see your score trend.</p></div>}
        </article>

        <article className="statistics-card statistics-chart-card">
          <div className="statistics-card-header"><div><h2>Score by job role</h2><p>Average score across completed sessions.</p></div><span className="chart-unit">Score / 10</span></div>
          {roleScores.length ? <div className="role-chart-list">
            {roleScores.map((role) => <div className="role-chart-row" key={role.name}>
              <div className="role-chart-heading"><strong>{role.name}</strong><span>{role.average.toFixed(1)} <small>/10</small></span></div>
              <div className="role-chart-track"><span style={{ width: `${role.average * 10}%` }} /></div>
              <span className="role-chart-count">{role.count} interview{role.count === 1 ? "" : "s"}</span>
            </div>)}
          </div> : <div className="statistics-empty"><h3>No role data yet</h3><p>Completed interviews will appear here.</p></div>}
        </article>
      </section>

      <section className="statistics-chart-grid statistics-lower-grid">
        <article className="statistics-card learning-plan-card">
          <div className="statistics-card-header">
            <div><h2>AI learning plan</h2><p>{learningPlan.summary}</p></div>
          </div>

          {learningPlan.topics.length ? (
            <>
              <ol className="learning-plan-list">
                {learningPlan.topics.map((topic, index) => (
                  <li key={`${topic.name}-${index}`} className="learning-plan-item">
                    <div className="learning-plan-item-row">
                      <span>{index + 1}. {topic.name}</span>
                      <strong>{topic.confidence}%</strong>
                    </div>
                    <div className="learning-plan-bar">
                      <span style={{ width: `${topic.confidence}%` }} />
                    </div>
                  </li>
                ))}
              </ol>

              <div className="learning-plan-next-step">
                <span>Recommended next step</span>
                <strong>{learningPlan.recommended_next_steps[0]}</strong>
              </div>
            </>
          ) : (
            <div className="statistics-empty"><h3>No learning insights yet</h3><p>Complete a few interviews to unlock your personalized plan.</p></div>
          )}
        </article>

        <article className="statistics-card insights-card">
          <div className="statistics-card-header"><div><h2>Focus areas</h2><p>Based on AI evaluations of completed answers.</p></div></div>
          <div className="focus-insight">
            <span>Weakest topic</span>
            <strong>{weakestTopic?.name || "Not enough data"}</strong>
            <small>{weakestTopic ? `${weakestTopic.average.toFixed(1)}/10 average across ${weakestTopic.count} interview${weakestTopic.count === 1 ? "" : "s"}` : "Topic tracking starts with new evaluations"}</small>
          </div>
          <div className="focus-insight weakest-role-insight">
            <span>Lowest-scoring role</span>
            <strong>{weakestRole?.name || "Not enough data"}</strong>
            <small>{weakestRole ? `${weakestRole.average.toFixed(1)}/10 average` : "Complete interviews across roles to compare"}</small>
          </div>
        </article>
      </section>
    </div>
  );
};

export default Statistics;
