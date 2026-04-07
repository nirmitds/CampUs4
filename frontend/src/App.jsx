import { BrowserRouter, Routes, Route } from "react-router-dom";

import Auth     from "./pages/Auth";
import Register from "./pages/Register";

import StudentLayout from "./layout/StudentLayout";
import Dashboard     from "./pages/Dashboard";
import Exchange      from "./pages/Exchange";
import Academic      from "./pages/Academic";
import Emergency     from "./pages/Emergency";
import Wallet        from "./pages/Wallet";
import Profile       from "./pages/StudentProfile";
import About         from "./pages/About";
import Readme        from "./pages/Readme";
import Settings      from "./pages/Settings";
import MyRequests    from "./pages/MyRequests";
import ExchangeChat  from "./pages/ExchangeChat";
import Messages      from "./pages/Messages";
import SocialChat    from "./pages/SocialChat";
import UserPublicProfile from "./pages/UserPublicProfile";

// Academic
import Notes       from "./pages/Notes";
import Assignments from "./pages/Assignments";
import Timetable   from "./pages/Timetable";
import Results     from "./pages/Results";
import Doubts      from "./pages/Doubts";
import Groups      from "./pages/Groups";

// Emergency
import Security    from "./pages/Security";
import Medical     from "./pages/Medical";
import ReportIssue from "./pages/ReportIssue";
import Support     from "./pages/Support";

import ProtectedRoute from "./components/ProtectedRoute";
import Admin      from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── PUBLIC ── */}
        <Route path="/"                element={<Auth />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/admin"           element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<Admin />} />

        {/* ── PROTECTED STUDENT PANEL ── */}
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index             element={<Dashboard />} />
          <Route path="dashboard"  element={<Dashboard />} />

          {/* Main */}
          <Route path="exchange"     element={<Exchange />} />
          <Route path="my-requests"  element={<MyRequests />} />
          <Route path="messages"     element={<Messages />} />
          <Route path="social"       element={<SocialChat />} />
          <Route path="social/:username" element={<SocialChat />} />
          <Route path="user/:username"   element={<UserPublicProfile />} />
          <Route path="chat/:id"     element={<ExchangeChat />} />
          <Route path="academic"     element={<Academic />} />
          <Route path="emergency"  element={<Emergency />} />
          <Route path="wallet"     element={<Wallet />} />
          <Route path="profile"    element={<Profile />} />
          <Route path="settings"   element={<Settings />} />
          <Route path="about"      element={<About />} />
          <Route path="readme"     element={<Readme />} />

          {/* Academic */}
          <Route path="notes"       element={<Notes />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="timetable"   element={<Timetable />} />
          <Route path="results"     element={<Results />} />
          <Route path="doubts"      element={<Doubts />} />
          <Route path="groups"      element={<Groups />} />

          {/* Emergency */}
          <Route path="security" element={<Security />} />
          <Route path="medical"  element={<Medical />} />
          <Route path="report"   element={<ReportIssue />} />
          <Route path="support"  element={<Support />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;