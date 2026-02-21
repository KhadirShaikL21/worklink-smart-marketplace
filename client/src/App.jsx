import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Assistant from './pages/Assistant.jsx';
import Jobs from './pages/Jobs.jsx';
import JobCreate from './pages/JobCreate.jsx';
import Matching from './pages/Matching.jsx';
import Notifications from './pages/Notifications.jsx';
import Chat from './pages/Chat.jsx';
import JobDetail from './pages/JobDetail.jsx';
import Profile from './pages/Profile.jsx';
import Workers from './pages/Workers.jsx';
import WorkerJobs from './pages/WorkerJobs.jsx';
import Home from './pages/Home.jsx';
import ThankYou from './pages/ThankYou.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import FindWork from './pages/FindWork.jsx';
import HelpCenter from './pages/HelpCenter.jsx';
import { useAuth } from './context/AuthContext.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import './styles/global.css';

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (!user.verification?.emailVerified && location.pathname !== '/verify-email') {
     return <Navigate to="/verify-email" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  if (!user || !user.roles.includes('admin')) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="assistant" element={<Protected><Assistant /></Protected>} />
        <Route path="jobs" element={<Protected><Jobs /></Protected>} />
        <Route path="jobs/new" element={<Protected><JobCreate /></Protected>} />
        <Route path="jobs/:jobId" element={<Protected><JobDetail /></Protected>} />
        <Route path="jobs/:jobId/matching" element={<Protected><Matching /></Protected>} />
        <Route path="find-work" element={<Protected><FindWork /></Protected>} />
        <Route path="worker-jobs" element={<Protected><WorkerJobs /></Protected>} />
        <Route path="help" element={<HelpCenter />} />
        <Route path="notifications" element={<Protected><Notifications /></Protected>} />
        <Route path="chat" element={<Protected><Chat /></Protected>} />
        <Route path="profile" element={<Protected><Profile /></Protected>} />
        <Route path="profile/:userId" element={<Protected><Profile /></Protected>} />
        <Route path="workers" element={<Protected><Workers /></Protected>} />
        <Route path="thank-you" element={<Protected><ThankYou /></Protected>} />
        
        {/* Admin Routes */}
        <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="admin/disputes" element={<AdminRoute><AdminDashboard /></AdminRoute>} /> {/* Placeholder */}
      </Route>
    </Routes>
  );
}
