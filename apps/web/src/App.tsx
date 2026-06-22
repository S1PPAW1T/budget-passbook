import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="app-loading">กำลังโหลด...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="app-loading">กำลังโหลด...</div>;
  return !user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
