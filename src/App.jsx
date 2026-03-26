import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Admin/Dashboard";
import Teams from "@/pages/Admin/Teams";
import Players from "@/pages/Admin/Players";
import Boulders from "@/pages/Admin/Boulders";
import Matches from "@/pages/Admin/Matches";
import Login from "@/pages/Admin/Login";
import PrivateRoute from "@/PrivateRoute";
import NotFound from "@/pages/404";
import Users from "@/pages/Admin/Users";
import ScorerPanel from "@/pages/Admin/ScorerPanel";
import OnsiteScoreboard from "@/pages/OnsiteScoreboard";
import BroadcastScoreboard from "@/pages/BroadcastScoreboard";
import MatchStats from "@/pages/Admin/MatchStats";
import MultiTeamMatchStats from "@/pages/Admin/MultiTeamMatchStats";

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
          path="/admin/scorer-panel/:matchId/:teamId"
          element={
            <PrivateRoute>
              <ScorerPanel />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/scorer-panel"
          element={
            <PrivateRoute>
              <ScorerPanel />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/match-stats/:matchId"
          element={
            <PrivateRoute>
              <MatchStats />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/multi-match-stats/:matchId"
          element={
            <PrivateRoute>
              <MultiTeamMatchStats />
            </PrivateRoute>
          }
        />

        {/* Public Routes */}
        <Route path="/broadcast-scoreboard/:matchId?" element={<BroadcastScoreboard />} />
        <Route path="/onsite-scoreboard/:matchId?" element={<OnsiteScoreboard />} />
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
