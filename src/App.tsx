import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import VolunteerDashboard from './components/VolunteerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
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
          <Route path="/user/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/volunteer/dashboard" element={<ProtectedRoute><VolunteerDashboard /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<PublicProfilePage />} />
          <Route path="/blood-emergency" element={<ProtectedRoute><BloodEmergencyPage /></ProtectedRoute>} />
          <Route path="/donor" element={<ProtectedRoute><DonorPage /></ProtectedRoute>} />
          <Route path="/general-tasks" element={<ProtectedRoute><GeneralTasksPage /></ProtectedRoute>} />
          <Route path="/rentals" element={<ProtectedRoute><RentalPage /></ProtectedRoute>} />
          <Route path="/rentals/create" element={<ProtectedRoute><RentalCreatePage /></ProtectedRoute>} />
          <Route path="/rentals/browse" element={<ProtectedRoute><RentalAcceptPage /></ProtectedRoute>} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/business/accept/:businessId/:taskId" element={<ProtectedRoute><BusinessAcceptPage /></ProtectedRoute>} />
          <Route path="/business/decline/:businessId/:taskId" element={<ProtectedRoute><BusinessAcceptPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><TaskHistoryPage /></ProtectedRoute>} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
