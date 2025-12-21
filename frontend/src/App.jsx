import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import InputForm from './pages/InputForm';
import History from './pages/History';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';

// CMS Components
import CMSLayout from './components/cms/layout/CMSLayout';
import CMSDashboard from './pages/cms/CMSDashboard';
import HeroEditor from './pages/cms/HeroEditor';
import FeaturesEditor from './pages/cms/FeaturesEditor';
import HowItWorksEditor from './pages/cms/HowItWorksEditor';
import ScreenshotEditor from './pages/cms/ScreenshotEditor';
import FooterEditor from './pages/cms/FooterEditor';
import BottomCTAEditor from './pages/cms/BottomCTAEditor';
import TestimonialEditor from './pages/cms/TestimonialEditor';
import UserManagement from './pages/cms/UserManagement';
import CMSSetup from './pages/CMSSetup';

// Get basename for GitHub Pages
// If homepage is set in package.json, extract the pathname
// Otherwise, use empty string for root domain
const getBasename = () => {
  // Check if we're on GitHub Pages (has /electricity-monitoring in path)
  const path = window.location.pathname;
  if (path.includes('/electricity-monitoring')) {
    return '/electricity-monitoring';
  }
  return '';
};

function App() {
  return (
    <AuthProvider>
      <Router
        basename={getBasename()}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/cms-setup" element={<CMSSetup />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/input" element={
              <ProtectedRoute>
                <InputForm />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />

            {/* CMS Routes - Admin Only */}
            <Route path="/cms/*" element={
              <ProtectedRoute requireAdmin>
                <CMSLayout>
                  <Routes>
                    <Route path="dashboard" element={<CMSDashboard />} />
                    <Route path="landing-page/hero" element={<HeroEditor />} />
                    <Route path="landing-page/features" element={<FeaturesEditor />} />
                    <Route path="landing-page/steps" element={<HowItWorksEditor />} />
                    <Route path="landing-page/screenshot" element={<ScreenshotEditor />} />
                    <Route path="landing-page/testimonial" element={<TestimonialEditor />} />
                    <Route path="landing-page/bottom-cta" element={<BottomCTAEditor />} />
                    <Route path="landing-page/footer" element={<FooterEditor />} />
                    <Route path="users" element={<UserManagement />} />
                  </Routes>
                </CMSLayout>
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;

