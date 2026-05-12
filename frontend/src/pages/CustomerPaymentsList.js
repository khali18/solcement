import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  Receipt,
  Search,
  Filter,
  Loader2,
  TrendingUp,
  DollarSign,
  User,
  Calendar,
  ArrowRight,
  Edit2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerPaymentsList = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalAmount: 0,
    count: 0
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [page, search]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(search && { search })
      };
      const response = await apiHelpers.getCustomerPayments(params);
      setPayments(response.data.data);
      setTotalPages(response.data.pagination.pages);
      
      // Calculate total amount for the current view
      const total = response.data.data.reduce((sum, p) => sum + p.amount, 0);
      setStats({
        totalAmount: total,
        count: response.data.pagination.total
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await apiHelpers.syncCustomerPayments();
      toast.success(response.data.message);
      fetchPayments();
    } catch (error) {
      toast.error('Failed to sync payments');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment? This will revert the customer balance and sale statuses.')) {
      try {
        await apiHelpers.deleteCustomerPayment(id);
        toast.success('Payment deleted successfully');
        fetchPayments();
      } catch (error) {
        toast.error('Failed to delete payment');
      }
    }
  };

  const getMethodBadge = (method) => {
    switch (method) {
      case 'cash': return 'badge-success';
      case 'bank_transfer': return 'badge-info';
      case 'mobile_money': return 'badge-warning';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Payments</h1>
          <p className="text-slate-500 mt-1">View all payments received from customers</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-secondary flex items-center"
          title="Import payments from older sales and transactions"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Existing Payments'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center mr-4">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Payments Recorded</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalAmount)}</p>
              <p className="text-xs text-slate-400 mt-1">Across {stats.count} transactions</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Transactions</p>
              <p className="text-2xl font-bold text-slate-900">{stats.count}</p>
              <p className="text-xs text-slate-400 mt-1">Successfully processed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by receipt or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Receipt</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Method</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Receipt className="w-4 h-4 text-slate-400 mr-2" />
                        <span className="font-medium text-slate-900">{payment.receiptNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center mr-2">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span className="text-sm text-slate-900">{payment.customer?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getMethodBadge(payment.paymentMethod)} capitalize`}>
                        {payment.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">
                      <div className="flex items-center justify-end">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {formatDateTime(payment.paymentDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => navigate(`/customers/${payment.customer?._id}/payments`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details / Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(payment._id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Payment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/customers/${payment.customer?._id}/payments`)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View Customer Ledger"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPaymentsList;
