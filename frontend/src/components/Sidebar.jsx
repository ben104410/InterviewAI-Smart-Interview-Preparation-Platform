const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <button type="button" className="sidebar-link active">
          Dashboard
        </button>
        <button type="button" className="sidebar-link">
          Interviews
        </button>
        <button type="button" className="sidebar-link">
          Resume
        </button>
        <button type="button" className="sidebar-link">
          Practice
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
