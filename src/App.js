import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';

import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Specialists from './pages/Specialists';
import SpecialistDetail from './pages/SpecialistDetail';
import Locations from './pages/Locations';
import Contacts from './pages/Contacts';
import Login from './pages/Login';
import Register from './pages/Register';

import ClientOverview from './pages/ClientDashboard/Overview';
import SpecialistSchedule from './pages/SpecialistDashboard/Schedule';
import RegistrarPanel from './pages/RegistrarDashboard/Panel';
import AdminDashboard from './pages/AdminDashboard/Dashboard';

import './App.css';

function App() {
  console.log({
  Home, Services, ServiceDetail, Specialists, SpecialistDetail,
  Locations, Contacts, Login, Register,
  ClientOverview, SpecialistSchedule, RegistrarPanel, AdminDashboard
});
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Header />
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

            <Route path="/client" element={<PrivateRoute allowedRoles={['client']}><ClientOverview /></PrivateRoute>} />
            <Route path="/specialist" element={<PrivateRoute allowedRoles={['specialist']}><SpecialistSchedule /></PrivateRoute>} />
            <Route path="/registrar" element={<PrivateRoute allowedRoles={['registrar']}><RegistrarPanel /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
          </Routes>
          <Footer />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;