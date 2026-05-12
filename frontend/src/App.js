import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Sales from './pages/Sales';
import SaleForm from './pages/SaleForm';
import SaleDetail from './pages/SaleDetail';
import Customers from './pages/Customers';
import CustomerForm from './pages/CustomerForm';
import CustomerDetail from './pages/CustomerDetail';
import CustomerPayments from './pages/CustomerPayments';
import CustomerPaymentsList from './pages/CustomerPaymentsList';
import Suppliers from './pages/Suppliers';
import SupplierForm from './pages/SupplierForm';
import Reports from './pages/Reports';
import Users from './pages/Users';
import UserForm from './pages/UserForm';
import LoginAudits from './pages/LoginAudits';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Protected Route component
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route component (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          
          {/* Products (Admin & Manager) */}
          <Route path="products" element={<ProtectedRoute roles={['admin', 'store_manager']}><Products /></ProtectedRoute>} />
          <Route path="products/new" element={<ProtectedRoute roles={['admin', 'store_manager']}><ProductForm /></ProtectedRoute>} />
          <Route path="products/:id/edit" element={<ProtectedRoute roles={['admin', 'store_manager']}><ProductForm /></ProtectedRoute>} />
          
          {/* Sales */}
          <Route path="sales" element={<Sales />} />
          <Route path="sales/new" element={<SaleForm />} />
          <Route path="sales/:id" element={<SaleDetail />} />
          
          {/* Customers */}
          <Route path="customers" element={<Customers />} />
          <Route path="customers/new" element={<CustomerForm />} />
          <Route path="customers/payments" element={<ProtectedRoute roles={['admin']}><CustomerPaymentsList /></ProtectedRoute>} />
          <Route path="customers/:id/edit" element={<ProtectedRoute roles={['admin', 'store_manager']}><CustomerForm /></ProtectedRoute>} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="customers/:id/payments" element={<ProtectedRoute roles={['admin']}><CustomerPayments /></ProtectedRoute>} />
          
          {/* Suppliers (Admin & Manager) */}
          <Route path="suppliers" element={<ProtectedRoute roles={['admin', 'store_manager']}><Suppliers /></ProtectedRoute>} />
          <Route path="suppliers/new" element={<ProtectedRoute roles={['admin', 'store_manager']}><SupplierForm /></ProtectedRoute>} />
          <Route path="suppliers/:id/edit" element={<ProtectedRoute roles={['admin', 'store_manager']}><SupplierForm /></ProtectedRoute>} />
          
          {/* Reports (Admin & Manager) */}
          <Route path="reports" element={<ProtectedRoute roles={['admin', 'store_manager']}><Reports /></ProtectedRoute>} />
          
          {/* Users (Admin only) */}
          <Route 
            path="users" 
            element={
              <ProtectedRoute roles={['admin']}>
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="users/new" 
            element={
              <ProtectedRoute roles={['admin']}>
                <UserForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="users/:id/edit" 
            element={
              <ProtectedRoute roles={['admin']}>
                <UserForm />
              </ProtectedRoute>
            } 
          />
          
          {/* Login Audits (Admin & Manager) */}
          <Route 
            path="login-audits" 
            element={
              <ProtectedRoute roles={['admin', 'store_manager']}>
                <LoginAudits />
              </ProtectedRoute>
            } 
          />
          
          {/* Settings */}
          <Route 
            path="settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
