import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Admin/Dashboard";
import Teams from "@/pages/Admin/Teams";
import Players from "@/pages/Admin/Players";
import Boulders from "@/pages/Admin/Boulders";
import Matches from "@/pages/Admin/Matches";
import Login from "@/pages/Admin/Login";
import PrivateRoute from "@/PrivateRoute";
import NotFound from "@/pages/404";
import MatchStats from "@/pages/Admin/MatchStats";
import BroadcastScoreboard from "@/pages/Live";
import OnsiteScoreboard from "@/pages/ScorePage";
import Users from "@/pages/Admin/Users";
import ScorerPage from "@/pages/Admin/ScorerPage";
import SelectionPage from "@/pages/Admin/SelectionPage";
import MultiTeamScorePage from "@/pages/MultiTeamScorePage";
import MultiTeamScorerPage from "@/pages/Admin/MultiTeamScorerPage";
import MultiTeamLive from "@/pages/MultiTeamLive";
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
          path="/admin/match-stats/:matchId"
          element={
            <PrivateRoute>
              <MatchStats />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/scorer/:matchId/:side"
          element={
            <PrivateRoute>
              <ScorerPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/scorer-multi/:matchId/:teamId"
          element={
            <PrivateRoute>
              <MultiTeamScorerPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/multi-team-scorer"
          element={
            <PrivateRoute>
              <MultiTeamScorerPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/team-selection"
          element={
            <PrivateRoute>
              <SelectionPage />
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
          path="/admin/multi-match-stats/:matchId"
          element={
            <PrivateRoute>
              <MultiTeamMatchStats />
            </PrivateRoute>
          }
        />

        {/* Public Routes */}
        <Route path="/multi-team-broadcast/:matchId?" element={<MultiTeamLive />} />
        <Route path="/broadcast-scoreboard" element={<BroadcastScoreboard />} />
        <Route path="/onsite-scoreboard" element={<OnsiteScoreboard />} />
        <Route
          path="/multi-team-onsite/:matchId?"
          element={<MultiTeamScorePage />}
        />
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
