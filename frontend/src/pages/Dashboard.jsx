import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const Dashboard = () => {
  return (
    <div className="app-layout">
      <Navbar />

      <div className="main-layout">
        <Sidebar />

        <main className="main-content">
          <h1>Dashboard</h1>
          <p>Welcome back! Your interview preparation dashboard is ready.</p>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;