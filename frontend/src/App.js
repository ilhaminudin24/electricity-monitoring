import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import InputForm from './pages/InputForm';
import History from './pages/History';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

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
    <Router 
      basename={getBasename()}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/input" element={<InputForm />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

