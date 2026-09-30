import { Link } from "react-router-dom";

const features = [
  {
    icon: "✦",
    title: "AI Mock Interviews",
    text: "Practice with realistic interview flows tailored to your target role and seniority.",
  },
  {
    icon: "◎",
    title: "Instant Feedback",
    text: "Get actionable coaching on confidence, clarity, and technical depth after each session.",
  },
  {
    icon: "▣",
    title: "Resume Intelligence",
    text: "Analyze your profile and uncover strengths, gaps, and interview-ready improvements.",
  },
];

const stats = [
  { value: "12k+", label: "interviews completed" },
  { value: "4.9/5", label: "candidate satisfaction" },
  { value: "72%", label: "faster prep cycles" },
];

const journey = [
  {
    step: "01",
    title: "Pick your role",
    text: "Start with the position you want to land and tailor your prep to the real interview brief.",
  },
  {
    step: "02",
    title: "Answer like a pro",
    text: "Respond to AI-driven questions that adapt to your strengths and the role’s requirements.",
  },
  {
    step: "03",
    title: "Improve with insight",
    text: "Review structured feedback, key strengths, and the next steps to close each gap.",
  },
];

const LandingPage = () => {
  return (
    <div className="landing-page-shell">
      <div className="glow-layer glow-one" />
      <div className="glow-layer glow-two" />
      <div className="glow-layer glow-three" />

      <header className="landing-header">
        <div className="brand-wrap">
          <div className="brand-mark">IA</div>
          <div>
            <div className="brand-name">InterviewAI</div>
            <div className="brand-tag">Smart interview preparation</div>
          </div>
        </div>

        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#outcomes">Outcomes</a>
          <a href="#journey">How it works</a>
          <Link to="/login">Login</Link>
          <Link to="/register" className="nav-cta">
            Get started
          </Link>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">AI-powered interview coaching</span>
            <h1>Turn preparation into performance.</h1>
            <p>
              Practice realistic interviews, sharpen your answers, and track your
              progress with a premium AI coach built for ambitious candidates.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="primary-btn">
                Start free
              </Link>
              <Link to="/login" className="secondary-btn">
                Sign in
              </Link>
            </div>

            <div className="mini-stats" id="outcomes">
              {stats.map((stat) => (
                <div key={stat.label} className="mini-stat">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="glass-card score-card">
              <div className="card-head">
                <span className="dot dot-blue" />
                <span className="dot dot-purple" />
                <span className="dot dot-green" />
              </div>

              <div className="score-body">
                <span className="label">Interview readiness</span>
                <div className="score-row">
                  <strong>89%</strong>
                  <span>+14% this week</span>
                </div>
                <div className="progress-bar">
                  <span />
                </div>
              </div>
            </div>

            <div className="glass-card signal-card">
              <p>Role match</p>
              <strong>Senior Product Manager</strong>
              <small>Confidence • Communications • Strategy</small>
            </div>
          </div>
        </section>

        <section className="brand-strip">
          <div className="brand-pill">Resume reviewed</div>
          <div className="brand-pill">Live AI feedback</div>
          <div className="brand-pill">Role-based prep</div>
          <div className="brand-pill">Progress tracking</div>
        </section>

        <section className="feature-grid" id="features">
          {features.map((feature) => (
            <article key={feature.title} className="glass-card feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </section>

        <section className="journey-panel" id="journey">
          <div className="section-heading">
            <span className="eyebrow">How it works</span>
            <h2>Practice with a workflow built for outcomes.</h2>
          </div>

          <div className="journey-grid">
            {journey.map((item) => (
              <article key={item.step} className="glass-card journey-item">
                <span className="journey-step">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-band">
          <div>
            <span className="eyebrow">Career momentum</span>
            <h2>Build interview confidence before the real meeting.</h2>
          </div>
          <Link to="/register" className="primary-btn">
            Create your profile
          </Link>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
