import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Packages from './pages/Packages';
import Deposit from './pages/Deposit';
import Withdrawals from './pages/Withdrawals';
import Sales from './pages/Sales';
import FeedingRecords from './pages/FeedingRecords';
import FlockManagement from './pages/FlockManagement';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Transactions from './pages/Transactions';
import AdminDashboard from './pages/AdminDashboard';
import MyTeam from './pages/MyTeam';
import ReferralRedirect from './components/ReferralRedirect';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-navy-950 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/packages" element={<Packages />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
              <Route path="/withdrawals" element={<ProtectedRoute><Withdrawals /></ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
              <Route path="/feeding" element={<ProtectedRoute><FeedingRecords /></ProtectedRoute>} />
              <Route path="/flocks" element={<ProtectedRoute><FlockManagement /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
              <Route path="/my-team" element={<ProtectedRoute><MyTeam /></ProtectedRoute>} />
              <Route path="/ref=:code" element={<ReferralRedirect />} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}