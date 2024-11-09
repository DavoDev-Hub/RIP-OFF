import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./components/auth/LoginPage";
import SignupPage from "./components/auth/SignupPage";
import MusicStreamingApp from "./components/MusicStreamingApp"; // Página principal

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/music" element={<MusicStreamingApp />} />{" "}
        {/* Página principal */}
      </Routes>
    </Router>
  );
}

export default App;
