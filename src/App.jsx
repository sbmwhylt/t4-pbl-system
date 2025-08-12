import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Admin/Dashboard";

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<Dashboard />} />

          {/* Placeholder for other pages */}
          <Route path="/" element={<h1>Public Homepage</h1>} />
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
