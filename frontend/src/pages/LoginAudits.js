import React, { useEffect, useState } from 'react';
import { apiHelpers } from '../utils/api';
import { formatDateTime } from '../utils/formatters';
import {
  Shield,
  Loader2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Calendar,
  User,
  Globe,
  Monitor,
  TrendingUp,
  Users,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Activity,
  History,
  FileText,
  CreditCard
} from 'lucide-react';

const LoginAudits = () => {
  const [audits, setAudits] = useState([]);
  const [stats, setStats] = useState({
    overall: { totalAttempts: 0, successful: 0, failed: 0 },
    today: { totalAttempts: 0, successful: 0, failed: 0 },
    uniqueUsersToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    username: '',
    startDate: '',
    endDate: ''
  });
  const [users, setUsers] = useState([]);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchAudits();
    fetchUsers();
  }, [page, filters]);

  const fetchUsers = async () => {
    try {
      const res = await apiHelpers.getUsers();
      setUsers(res.data.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 25,
        ...(filters.status && { status: filters.status }),
        ...(filters.username && { username: filters.username }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      };

      const response = await apiHelpers.getLoginAudits(params);
      setAudits(response.data.data);
      setTotalPages(response.data.pagination.pages);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching login audits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearOld = async () => {
    if (!window.confirm('Are you sure you want to clear login audits older than 30 days?')) return;

    setClearing(true);
    try {
      await apiHelpers.clearLoginAudits({ days: 30 });
      fetchAudits();
    } catch (error) {
      console.error('Error clearing audits:', error);
    } finally {
      setClearing(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const getStatusBadge = (status) => {
    if (status === 'success') {
      return (
        <span className="badge-success flex items-center">
          <CheckCircle className="w-3 h-3 mr-1" />
          Success
        </span>
      );
    }
    return (
      <span className="badge-danger flex items-center">
        <XCircle className="w-3 h-3 mr-1" />
        Failed
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-emerald-100 text-emerald-800',
      store_manager: 'bg-sky-100 text-sky-800',
      sales_staff: 'bg-amber-100 text-amber-800'
    };
    return styles[role] || 'bg-slate-100 text-slate-800';
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="card p-4">
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-lg bg-${color}-100 flex items-center justify-center mr-3`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
          {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Login Audit Trail</h1>
          <p className="text-slate-500 mt-1">Track all login attempts and user access</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAudits}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleClearOld}
            className="btn-danger"
            disabled={clearing}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Old
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Logins"
          value={stats.today.successful}
          icon={TrendingUp}
          color="emerald"
          subtext={`${stats.today.totalAttempts} total attempts`}
        />
        <StatCard
          title="Failed Today"
          value={stats.today.failed}
          icon={AlertTriangle}
          color="rose"
          subtext="Failed attempts"
        />
        <StatCard
          title="Unique Users"
          value={stats.uniqueUsersToday}
          icon={Users}
          color="sky"
          subtext="Users logged in today"
        />
        <StatCard
          title="Total Logins"
          value={stats.overall.totalAttempts}
          icon={Shield}
          color="slate"
          subtext="All time attempts"
        />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <select
              value={filters.username}
              onChange={(e) => handleFilterChange('username', e.target.value)}
              className="input"
            >
              <option value="">All Users</option>
              {users.map(u => (
                <option key={u._id} value={u.username}>
                  {u.name} ({u.username})
                </option>
              ))}
            </select>
          </div>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input lg:w-40"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="input"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="input"
              placeholder="End Date"
            />
          </div>
        </div>
      </div>

      {/* Login Audits Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Date & Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
                  </td>
                </tr>
              ) : audits.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500">No login audits found</p>
                  </td>
                </tr>
              ) : (
                audits.map((audit) => (
                  <AuditRow key={audit._id} audit={audit} getRoleBadge={getRoleBadge} getStatusBadge={getStatusBadge} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AuditRow = ({ audit, getRoleBadge, getStatusBadge }) => {
  const [expanded, setExpanded] = useState(false);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleExpand = async () => {
    if (!expanded && activity.length === 0 && audit.user) {
      setLoading(true);
      try {
        const res = await apiHelpers.getUserActivity(audit.user);
        setActivity(res.data.data);
      } catch (err) {
        console.error('Failed to load activity:', err);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  return (
    <>
      <tr 
        className={`hover:bg-slate-50 cursor-pointer transition-colors ${expanded ? 'bg-slate-50' : ''}`}
        onClick={toggleExpand}
      >
        <td className="px-6 py-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
              {expanded ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-emerald-600" />}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {audit.name || 'Unknown'}
              </p>
              <p className="text-xs text-slate-500">{audit.username}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          {audit.role && (
            <span className={`badge ${getRoleBadge(audit.role)}`}>
              {audit.role.replace('_', ' ')}
            </span>
          )}
        </td>
        <td className="px-6 py-4 text-center">
          {getStatusBadge(audit.status)}
        </td>
        <td className="px-6 py-4 text-sm text-slate-600">
          {audit.reason || '-'}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center text-sm text-slate-600">
            <Globe className="w-4 h-4 mr-1 text-slate-400" />
            {audit.ipAddress || '-'}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center text-sm text-slate-600">
            <Calendar className="w-4 h-4 mr-1 text-slate-400" />
            {formatDateTime(audit.loginTime)}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan="6" className="px-6 py-4 bg-slate-50/50 border-y border-slate-100">
            <div className="pl-12 py-2">
              <div className="flex items-center mb-4 text-slate-900 font-semibold">
                <Activity className="w-4 h-4 mr-2 text-emerald-600" />
                Recent Activity for {audit.name}
              </div>
              
              {loading ? (
                <div className="flex items-center py-4 text-slate-500 text-sm italic">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Fetching user history...
                </div>
              ) : activity.length === 0 ? (
                <p className="text-sm text-slate-500 italic py-2">No additional activity found for this user.</p>
              ) : (
                <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {activity.map((act, i) => (
                    <div key={i} className="relative pl-8">
                      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center">
                        {act.type === 'login' ? <Shield className="w-2 h-2 text-emerald-600" /> : 
                         act.type === 'sale' ? <FileText className="w-2 h-2 text-emerald-600" /> : 
                         <CreditCard className="w-2 h-2 text-emerald-600" />}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-sm text-slate-700">{act.description}</span>
                        <span className="text-xs text-slate-400 font-medium">
                          {formatDateTime(act.date)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default LoginAudits;
