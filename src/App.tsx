import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Room from "./pages/Room";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#1A1A1A]">
        <Routes>
          <Route path="/" element={<Room />} />
        </Routes>
        <Toaster position="bottom-right" />
      </div>
    </Router>
  );
}
