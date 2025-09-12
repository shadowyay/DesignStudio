import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import VolunteerDashboard from './components/VolunteerDashboard';
import PublicProfilePage from './pages/PublicProfilePage';
import BloodEmergencyPage from './pages/BloodEmergencyPage';
import DonorPage from './pages/DonorPage';
import GeneralTasksPage from './pages/GeneralTasksPage';
import RentalPage from './pages/RentalPage';
import RentalCreatePage from './pages/RentalCreatePage';
import RentalAcceptPage from './pages/RentalAcceptPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import BusinessAcceptPage from './pages/BusinessAcceptPage';
import TaskHistoryPage from './pages/TaskHistoryPage';

// Component to redirect /dashboard to appropriate role-based dashboard
const DashboardRedirect = () => {
  const userRole = localStorage.getItem('userRole');
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/user/auth" replace />;
  }
  
  if (userRole === 'volunteer') {
    return <Navigate to="/volunteer/dashboard" replace />;
  } else {
    return <Navigate to="/user/dashboard" replace />;
  }
};

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/user/auth" element={<AuthForm />} />
          <Route path="/volunteer/auth" element={<AuthForm isVolunteer={true} />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/user/dashboard" element={<Dashboard />} />
          <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
          <Route path="/profile/:userId" element={<PublicProfilePage />} />
          <Route path="/blood-emergency" element={<BloodEmergencyPage />} />
          <Route path="/donor" element={<DonorPage />} />
          <Route path="/general-tasks" element={<GeneralTasksPage />} />
          <Route path="/rentals" element={<RentalPage />} />
          <Route path="/rentals/create" element={<RentalCreatePage />} />
          <Route path="/rentals/browse" element={<RentalAcceptPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/business/accept/:businessId/:taskId" element={<BusinessAcceptPage />} />
          <Route path="/business/decline/:businessId/:taskId" element={<BusinessAcceptPage />} />
          <Route path="/history" element={<TaskHistoryPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
