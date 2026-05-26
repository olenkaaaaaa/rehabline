import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

import Header from './components/Header';
import Footer from './components/Footer';

import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Specialists from './pages/Specialists';
import SpecialistDetail from './pages/SpecialistDetail';
import Locations from './pages/Locations';
import Contacts from './pages/Contacts';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import AuthCallback from './pages/AuthCallback';

import BookingWizard from './pages/BookingWizard/BookingWizard';

import SpecialistOverview from './pages/SpecialistDashboard/Dashboard';
import SpecialistAppointments from './pages/SpecialistDashboard/Appointments';
import SpecialistClients from './pages/SpecialistDashboard/Clients';
import SpecialistProfile from './pages/SpecialistDashboard/Profile';

import ClientDashboard from './pages/ClientDashboard/ClientDashboard';
import ClientOverview from './pages/ClientDashboard/Overview';
import ClientRecords from './pages/ClientDashboard/MyRecords';
import ClientRecordDetail from './pages/ClientDashboard/RecordDetail';
import ClientDocuments from './pages/ClientDashboard/Documents';
import ClientReviews from './pages/ClientDashboard/MyReviews';
import ClientRecommendations from './pages/ClientDashboard/Recommendations';
import ClientProfile from './pages/ClientDashboard/Profile';
import ClientSettings from './pages/ClientDashboard/Settings';

import SpecialistDashboard from './pages/SpecialistDashboard/SpecialistDashboard';
import SpecialistScheduleSettings from './pages/SpecialistDashboard/ScheduleSettings';


import RegistrarDashboard from './pages/RegistrarDashboard/RegistrarDashboard';
import RegistrarPanel from './pages/RegistrarDashboard/Panel';
import RegistrarAppointments from './pages/RegistrarDashboard/AppointmentPanel';
import RegistrarCreateAppointment from './pages/RegistrarDashboard/CreateAppointment';
import RegistrarWaitlist from './pages/RegistrarDashboard/Waitlist';
import RegistrarClients from './pages/RegistrarDashboard/Clients';
import RegistrarCommunications from './pages/RegistrarDashboard/Communications';
import ScheduleRequests from './pages/RegistrarDashboard/ScheduleRequests';

import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminOverview from './pages/AdminDashboard/Dashboard';
import AdminAppointments from './pages/AdminDashboard/Appointments';
import AdminServices from './pages/AdminDashboard/Services';
import AdminSpecialists from './pages/AdminDashboard/Specialists';
import AdminUsers from './pages/AdminDashboard/Users';
import AdminLocations from './pages/AdminDashboard/Locations';
import AdminSettings from './pages/AdminDashboard/Settings';
import AuditLog from './pages/AdminDashboard/AuditLog';
import ClientMessages from './pages/ClientDashboard/Messages';

const getRoleHome = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'registrar') return '/registrar';
  if (role === 'specialist') return '/specialist';
  return '/client';
};

const isDashboardRoute = (pathname) =>
  pathname === '/admin' ||
  pathname.startsWith('/admin/') ||
  pathname === '/registrar' ||
  pathname.startsWith('/registrar/') ||
  pathname === '/specialist' ||
  pathname.startsWith('/specialist/') ||
  pathname === '/client' ||
  pathname.startsWith('/client/');

const LoaderScreen = () => (
  <div className="app-loader">
    <div className="loader-card">
      <h2>RehabLine</h2>
      <p>Завантаження...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoaderScreen />;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  const role = profile?.role || 'client';

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return children;
};

const GuestRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoaderScreen />;

  if (user) {
    return <Navigate to={getRoleHome(profile?.role || 'client')} replace />;
  }

  return children;
};

const BookingRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoaderScreen />;

  if (!user) return <Navigate to="/login" replace />;

  const role = profile?.role || 'client';

  if (role !== 'client') {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return children;
};

const AppLayout = () => {
  const location = useLocation();
  const isDashboard = isDashboardRoute(location.pathname);

  return (
    <div className="app">
      {!isDashboard && <Header />}

      <main className={isDashboard ? 'dashboard-main-wrapper' : 'public-main-wrapper'}>
        <Routes>
          <Route path="/" element={<Home />} />
<Route path="/services" element={<Services />} />
<Route path="/services/:id" element={<ServiceDetail />} />

<Route path="/specialists" element={<Specialists />} />
<Route path="/specialists/:id" element={<SpecialistDetail />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/client/messages" element={<ClientMessages />} />

          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />

          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />

          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPassword />
              </GuestRoute>
            }
          />

          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route
            path="/booking"
            element={
              <BookingRoute>
                <BookingWizard />
              </BookingRoute>
            }
          />

          <Route
            path="/client"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <ClientDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<ClientOverview />} />
            <Route path="records" element={<ClientRecords />} />
            <Route path="records/:id" element={<ClientRecordDetail />} />
            <Route path="documents" element={<ClientDocuments />} />
            <Route path="reviews" element={<ClientReviews />} />
            <Route path="recommendations" element={<ClientRecommendations />} />
            <Route path="profile" element={<ClientProfile />} />
            <Route path="settings" element={<ClientSettings />} />
          </Route>

          <Route
            path="/specialist"
            element={
              <ProtectedRoute allowedRoles={['specialist']}>
                <SpecialistDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<SpecialistOverview />} />
            <Route path="appointments" element={<SpecialistAppointments />} />
            <Route path="clients" element={<SpecialistClients />} />
            <Route path="schedule-settings" element={<SpecialistScheduleSettings />} />
            <Route path="profile" element={<SpecialistProfile />} />
          </Route>

          <Route
            path="/registrar"
            element={
              <ProtectedRoute allowedRoles={['registrar']}>
                <RegistrarDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<RegistrarPanel />} />
            <Route path="appointments" element={<RegistrarAppointments />} />
            <Route path="create" element={<RegistrarCreateAppointment />} />
            <Route path="schedule-requests" element={<ScheduleRequests />} />
            <Route path="waitlist" element={<RegistrarWaitlist />} />
            <Route path="clients" element={<RegistrarClients />} />
            <Route path="communications" element={<RegistrarCommunications />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="schedule-requests" element={<ScheduleRequests />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="specialists" element={<AdminSpecialists />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="locations" element={<AdminLocations />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="audit" element={<AuditLog />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isDashboard && <Footer />}
    </div>
  );
};

const App = () => (
  <LanguageProvider>
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  </LanguageProvider>
);

export default App;