import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import VolunteerDashboard from './components/VolunteerDashboard';
import PublicProfilePage from './pages/PublicProfilePage';
import BloodEmergencyPage from './pages/BloodEmergencyPage';
import DonorPage from './pages/DonorPage';
import GeneralTasksPage from './pages/GeneralTasksPage';
import EmailVerificationPage from './pages/EmailVerificationPage';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/user/auth" element={<AuthForm />} />
          <Route path="/volunteer/auth" element={<AuthForm isVolunteer={true} />} />
          <Route path="/user/dashboard" element={<Dashboard />} />
          <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
          <Route path="/profile/:userId" element={<PublicProfilePage />} />
          <Route path="/blood-emergency" element={<BloodEmergencyPage />} />
          <Route path="/donor" element={<DonorPage />} />
          <Route path="/general-tasks" element={<GeneralTasksPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
