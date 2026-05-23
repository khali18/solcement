import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  UserCog,
  ChevronDown,
  ChevronRight,
  Bell,
  Shield,
  CreditCard,
  Calculator
} from 'lucide-react';

const Layout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ...(hasRole(['admin', 'store_manager']) ? [{ name: 'Inventory', href: '/products', icon: Package }] : []),
    ...(hasRole(['admin', 'sales_staff']) ? [{ name: 'Sales', href: '/sales', icon: ShoppingCart }] : []),
    { name: 'Estimate Calculator', href: '/estimate', icon: Calculator },
    { name: 'Customers', href: '/customers', icon: Users },
    ...(hasRole(['admin', 'store_manager']) ? [
      { name: 'Suppliers', href: '/suppliers', icon: Truck },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
      { name: 'Login Audits', href: '/login-audits', icon: Shield }
    ] : []),
    ...(hasRole('admin') ? [
      { name: 'Users', href: '/users', icon: UserCog },
      { name: 'Customer Payments', href: '/customers/payments', icon: CreditCard }
    ] : [])
  ];

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'store_manager':
        return 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-full w-72 flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 transform transition-all duration-300 ease-in-out lg:translate-x-0 shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-slate-700 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img src="/logo-small.svg" alt="SOL CEMENT" className="w-12 h-12 rounded-xl shadow-lg ring-2 ring-emerald-500/20" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight">SOL CEMENT</span>
              <p className="text-xs text-emerald-400 font-medium">Build The Future</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Main Menu</p>
            {navigation.slice(0, 3).map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white hover:translate-x-1'
                  }`
                }
              >
                <item.icon className={`w-5 h-5 mr-3 transition-colors duration-200 ${
                  'group-hover:text-emerald-400'
                }`} />
                <span className="flex-1">{item.name}</span>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </NavLink>
            ))}
          </div>

          {navigation.length > 3 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Management</p>
              {navigation.slice(3).map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white hover:translate-x-1'
                    }`
                  }
                >
                  <item.icon className={`w-5 h-5 mr-3 transition-colors duration-200 ${
                    'group-hover:text-blue-400'
                  }`} />
                  <span className="flex-1">{item.name}</span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* User info & Logout */}
        <div className="border-t border-slate-700 p-4 bg-slate-900/50">
          <div className="flex items-center mb-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <span className="text-sm font-semibold text-emerald-400">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name}
              </p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(user?.role)}`}>
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <NavLink
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`
              }
            >
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full group flex items-center px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-200" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-72">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm relative">
          <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Company Logo */}
              <div className="flex-1 flex justify-center lg:justify-start lg:ml-8">
                <div className="flex items-center space-x-2">
                  <img src="/logo-small.svg" alt="SOL CEMENT" className="w-8 h-8 rounded-lg shadow-lg" />
                  <div className="hidden lg:block">
                    <span className="text-lg font-bold text-slate-900">SOL CEMENT</span>
                    <p className="text-xs text-slate-500">Build The Future</p>
                  </div>
                </div>
              </div>

              {/* Right side items */}
              <div className="flex items-center space-x-2">
                {/* Notifications */}
                <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 relative hover:shadow-sm transition-all">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                </button>

                {/* User Avatar */}
                <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                    <span className="text-sm font-semibold text-emerald-700">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
