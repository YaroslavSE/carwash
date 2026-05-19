import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrdersManager from './pages/OrdersManager';
import BranchesManager from './pages/BranchesManager';
import EmployeesManager from './pages/EmployeesManager';
import ServicesManager from './pages/ServicesManager';
import PlansManager from './pages/PlansManager';
import ReviewsManager from './pages/ReviewsManager';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={
        <AuthRoute>
          <Login />
        </AuthRoute>
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<OrdersManager />} />
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Route path="employees" element={<EmployeesManager />} />
        )}
        
        {user?.role === 'admin' && (
          <>
            <Route path="branches" element={<BranchesManager />} />
            <Route path="services" element={<ServicesManager />} />
            <Route path="plans" element={<PlansManager />} />
            <Route path="reviews" element={<ReviewsManager />} />
          </>
        )}
      </Route>
    </Routes>
  );
}

export default App;
