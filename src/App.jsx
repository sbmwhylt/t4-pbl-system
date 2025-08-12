import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Admin/Dashboard";
import Teams from "./pages/Admin/Teams";
import Players from "./pages/Admin/Players";
import Boulders from "./pages/Admin/Boulders";
import Matches from "./pages/Admin/Matches";
import LiveView from "./pages/Scoreboard/LiveView"; 


function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/teams" element={<Teams />} />
          <Route path="/admin/players" element={<Players />} />
          <Route path="/admin/boulders" element={<Boulders />} />
          <Route path="/admin/matches" element={<Matches />} />
          <Route path="/scoreboard/liveview" element={<LiveView />} />

          {/* Placeholder for other pages */}
          <Route path="/" element={<h1>Public Homepage</h1>} />
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
