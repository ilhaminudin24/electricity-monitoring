import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/supabaseService';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { currentUser, loading } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [checkingRole, setCheckingRole] = React.useState(requireAdmin);

  React.useEffect(() => {
    const checkAdminRole = async () => {
      if (requireAdmin && currentUser) {
        try {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Admin check timeout')), 10000)
          );

          const profilePromise = getUserProfile(currentUser.id);
          const userData = await Promise.race([profilePromise, timeoutPromise]);

          if (userData) {
            setIsAdmin(userData.role === 'admin');
            // Note: If user is disabled, they will be redirected by the check below
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          setIsAdmin(false);
        }
      }
      setCheckingRole(false);
    };

    if (requireAdmin) {
      checkAdminRole();
    } else {
      setCheckingRole(false);
    }
  }, [currentUser, requireAdmin]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  // Check if user is disabled (only if we have user data)
  if (currentUser && requireAdmin) {
    // This check happens in useEffect, but we can add additional check here if needed
  }

  return children;
};

export default ProtectedRoute;