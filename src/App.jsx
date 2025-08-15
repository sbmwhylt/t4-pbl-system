import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Admin/Dashboard";
import Teams from "./pages/Admin/Teams";
import Players from "./pages/Admin/Players";
import Boulders from "./pages/Admin/Boulders";
import Matches from "./pages/Admin/Matches";
import LiveView from "./pages/Scoreboard/LiveView";
import MatchPanel from "./pages/Scoreboard/MatchPanel";
import Login from "./pages/Admin/Login";
import PrivateRoute from "./PrivateRoute"; 
import NotFound from "./pages/404";
import MatchStats from "./pages/Admin/MatchStats";

function App() {
  return (
    <Router>
      <Routes>
        {/* Protected Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/teams"
          element={
            <PrivateRoute>
              <Teams />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/players"
          element={
            <PrivateRoute>
              <Players />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/boulders"
          element={
            <PrivateRoute>
              <Boulders />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/matches"
          element={
            <PrivateRoute>
              <Matches />
            </PrivateRoute>
          }
        />
        <Route
          path="/match-panel/:matchId"
          element={
            <PrivateRoute>
              <MatchPanel />
            </PrivateRoute>
          }
        />

        <Route
          path="/match-stats/:matchId"
          element={
            <PrivateRoute>
              <MatchStats />
            </PrivateRoute>
          }
        />

        {/* Public Routes */}
        <Route path="/scoreboard/liveview" element={<LiveView />} />
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
