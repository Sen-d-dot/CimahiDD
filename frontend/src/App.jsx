import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Backdrop } from './components/ui';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CompanyDetail from './pages/CompanyDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import CompanyDashboard from './pages/CompanyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Messages from './pages/Messages';

function ProtectedRoute({ roles, children }) {
    const { user } = useAuth();
    const location = useLocation();
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
    return children;
}

function Layout() {
    const location = useLocation();
    return (
        <div className="min-h-screen flex flex-col">
            <Backdrop />
            <Navbar />
            <main key={location.pathname} className="page-enter flex-grow">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/perusahaan/:id" element={<CompanyDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<ProtectedRoute roles={['company']}><CompanyDashboard /></ProtectedRoute>} />
                    <Route path="/pesan" element={<ProtectedRoute roles={['company', 'investor']}><Messages /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <AuthProvider>
                <ToastProvider>
                    <Layout />
                </ToastProvider>
            </AuthProvider>
        </Router>
    );
}
