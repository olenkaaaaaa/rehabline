import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import NotificationManager from './components/NotificationManager'; // додано

// Публічні сторінки
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Specialists from './pages/Specialists';
import SpecialistDetail from './pages/SpecialistDetail';
import Locations from './pages/Locations';
import Contacts from './pages/Contacts';
import Login from './pages/Login';
import Register from './pages/Register';

// Дашборд клієнта
import ClientDashboard from './pages/ClientDashboard/ClientDashboard';
import Overview from './pages/ClientDashboard/Overview';
import MyRecords from './pages/ClientDashboard/MyRecords';
import RecordDetail from './pages/ClientDashboard/RecordDetail';
import Profile from './pages/ClientDashboard/Profile';
import Settings from './pages/ClientDashboard/Settings';
import Documents from './pages/ClientDashboard/Documents'; // додано
import MyReviews from './pages/ClientDashboard/MyReviews';
import Recommendations from './pages/ClientDashboard/Recommendations';

// Інші дашборди
import SpecialistSchedule from './pages/SpecialistDashboard/Schedule';
import RegistrarPanel from './pages/RegistrarDashboard/Panel';
import AdminDashboard from './pages/AdminDashboard/Dashboard';

// Ворзард запису
import BookingWizard from './pages/BookingWizard/BookingWizard';
// Імпортуйте компоненти
import SpecialistDashboard from './pages/SpecialistDashboard/SpecialistDashboard';
import Schedule from './pages/SpecialistDashboard/Schedule';
import Appointments from './pages/SpecialistDashboard/Appointments';
import Clients from './pages/SpecialistDashboard/Clients';
import ScheduleSettings from './pages/SpecialistDashboard/ScheduleSettings';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Header />
          <NotificationManager /> {/* додано */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/specialists" element={<Specialists />} />
            <Route path="/specialists/:id" element={<SpecialistDetail />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Клієнт */}
            <Route
              path="/client"
              element={
                <PrivateRoute allowedRoles={['client']}>
                  <ClientDashboard />
                </PrivateRoute>
              }
            >
              
              <Route index element={<Overview />} />
              <Route path="records" element={<MyRecords />} />
              <Route path="records/:id" element={<RecordDetail />} />
              <Route path="documents" element={<Documents />} />
              <Route path="reviews" element={<MyReviews />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Спеціаліст */}
            <Route
              path="/specialist"
              element={
                <PrivateRoute allowedRoles={['specialist']}>
                  <SpecialistSchedule />
                </PrivateRoute>
              }
            />

            {/* Реєстратор */}
            <Route
              path="/registrar"
              element={
                <PrivateRoute allowedRoles={['registrar']}>
                  <RegistrarPanel />
                </PrivateRoute>
              }
            />

            {/* Адмін */}
            <Route
              path="/admin"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />

            {/* Бронювання */}
            <Route
              path="/booking"
              element={
                <PrivateRoute allowedRoles={['client']}>
                  <BookingWizard />
                </PrivateRoute>
              }
            />
            
<Route
  path="/specialist"
  element={
    <PrivateRoute allowedRoles={['specialist']}>
      <SpecialistDashboard />
    </PrivateRoute>
  }
>
  <Route index element={<Schedule />} />
  <Route path="appointments" element={<Appointments />} />
  <Route path="clients" element={<Clients />} />
  <Route path="schedule-settings" element={<ScheduleSettings />} />
</Route>
          </Routes>
          <Footer />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;