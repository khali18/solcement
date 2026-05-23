import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  ShoppingCart,
  Loader2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Filter,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const Sales = () => {
  const { hasRole } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSales();
  }, [search, statusFilter, startDate, endDate, page]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(search && { search }),
        ...(statusFilter && { paymentStatus: statusFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      };
      
      const response = await apiHelpers.getSales(params);
      setSales(response.data.data);
      setSummary(response.data.summary || {});
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    const csvContent = [
      ['Invoice', 'Customer', 'Date', 'Total', 'Paid', 'Balance', 'Status', 'Payment Method'].join(','),
      ...sales.map(s => [
        s.invoiceNumber,
        `"${s.customer?.name || 'N/A'}"`,
        new Date(s.createdAt).toLocaleDateString(),
        s.total,
        s.amountPaid,
        s.amountDue,
        s.paymentStatus,
        getPaymentMethodLabel(s.paymentMethod)
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const statusBadge = (status) => {
    const styles = {
      paid: 'bg-emerald-100 text-emerald-700',
      partial: 'bg-amber-100 text-amber-700',
      unpaid: 'bg-red-100 text-red-700'
    };
    const icons = {
      paid: <CheckCircle className="w-3 h-3 mr-1 inline" />,
      partial: <Clock className="w-3 h-3 mr-1 inline" />,
      unpaid: <XCircle className="w-3 h-3 mr-1 inline" />
    };
    return (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  const hasActiveFilters = search || statusFilter || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-500 mt-1">Manage invoices and track payments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadCSV} className="btn-secondary">
            <Download className="w-5 h-5 mr-2" />
            Export CSV
          </button>
          {hasRole(['admin', 'sales_staff']) && (
            <Link to="/sales/new" className="btn-primary">
              <Plus className="w-5 h-5 mr-2" />
              New Sale
            </Link>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(summary?.totalSales || 0)}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Collected</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(summary?.totalPaid || 0)}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Outstanding Balance</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(summary?.totalDue || 0)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice or customer name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input lg:w-44"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="input"
                title="From date"
              />
            </div>
            <div className="flex-1">
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="input"
                title="To date"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-secondary whitespace-nowrap text-sm">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Sales Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 font-medium">No sales found</p>
                    {hasActiveFilters && <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>}
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/sales/${sale._id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                        {sale.invoiceNumber}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">{getPaymentMethodLabel(sale.paymentMethod)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{sale.customer?.name}</p>
                      {sale.salesPerson?.name && (
                        <p className="text-xs text-gray-400">by {sale.salesPerson.name}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {statusBadge(sale.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {sale.amountDue > 0 ? (
                        <span className="text-sm font-semibold text-red-600">{formatCurrency(sale.amountDue)}</span>
                      ) : (
                        <span className="text-sm text-emerald-600 font-medium">✓ Settled</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link to={`/sales/${sale._id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg inline-flex" title="View Details">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;
