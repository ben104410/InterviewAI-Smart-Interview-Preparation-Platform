import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="sidebar">

      <div className="sidebar-section">
        <p className="sidebar-title">MAIN</p>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span>▦</span>
          Dashboard
        </NavLink>

        <NavLink
          to="/interview"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span>◉</span>
          AI Interview
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span>◷</span>
          Interview History
        </NavLink>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-title">CAREER</p>

        <NavLink
          to="/resume"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span>▤</span>
          Resume Analysis
        </NavLink>

        <NavLink
          to="/statistics"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span>▥</span>
          Statistics
        </NavLink>
      </div>

      <div className="sidebar-section sidebar-bottom">

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span>◎</span>
          Profile
        </NavLink>

      </div>

    </aside>
  );
};

export default Sidebar;