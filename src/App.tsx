import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import VolunteerDashboard from './components/VolunteerDashboard';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/user/auth" element={<AuthForm />} />
          <Route path="/user/dashboard" element={<Dashboard />} />
          <Route path="/volunteer/auth" element={<AuthForm isVolunteer />} />
          <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
