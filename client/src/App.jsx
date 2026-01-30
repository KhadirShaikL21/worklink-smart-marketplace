import { Route, Routes, Navigate } from 'react-router-dom';
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
import { useAuth } from './context/AuthContext.jsx';
import './styles/global.css';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  
  // Force email verification
  if (!user.verification?.emailVerified && window.location.pathname !== '/verify-email') {
    // Allow access to verify-email page itself to prevent loop
    return <Navigate to="/verify-email" replace />;
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
        <Route path="notifications" element={<Protected><Notifications /></Protected>} />
        <Route path="chat" element={<Protected><Chat /></Protected>} />
        <Route path="profile" element={<Protected><Profile /></Protected>} />
        <Route path="profile/:userId" element={<Protected><Profile /></Protected>} />
        <Route path="workers" element={<Protected><Workers /></Protected>} />
        <Route path="thank-you" element={<Protected><ThankYou /></Protected>} />
      </Route>
    </Routes>
  );
}
