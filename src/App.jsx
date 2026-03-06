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
import Live from "@/pages/Live";
import Score from "@/pages/ScorePage";
import User from "@/pages/Admin/Users";
import ScorerPage from "@/pages/Admin/ScorerPage";
import SelectionPage from "@/pages/Admin/SelectionPage";
import MultiTeamScorePage from "@/pages/MultiTeamScorePage";
import MultiTeamScorerPage from "@/pages/Admin/MultiTeamScorerPage";

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
          path="/admin/games"
          element={
            <PrivateRoute>
              <Matches />
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

        <Route
          path="/scorer/:matchId/:side"
          element={
            <PrivateRoute>
              <ScorerPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/scorer-multi/:matchId/:teamId"
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
          path="/admin/selection"
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
              <User />
            </PrivateRoute>
          }
        />

        {/* Public Routes */}
        <Route path="/broadcast-scoreboard" element={<Live />} />
        <Route path="/onsite-scoreboard" element={<Score />} />
        <Route
          path="/multi-match/:matchId?"
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
