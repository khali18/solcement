import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '../utils/formatters';
import {
  Plus,
  Search,
  ShoppingCart,
  Loader2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Download
} from 'lucide-react';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetchSales();
  }, [search, statusFilter]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = {
        ...(search && { search }),
        ...(statusFilter && { paymentStatus: statusFilter })
      };
      
      const response = await apiHelpers.getSales(params);
      setSales(response.data.data);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'partial':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'badge-success',
      partial: 'badge-warning',
      unpaid: 'badge-danger'
    };
    return styles[status] || 'badge-gray';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-500 mt-1">Manage invoices and track payments</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const csvContent = [
                ['Invoice', 'Customer', 'Date', 'Total', 'Status', 'Balance'].join(','),
                ...sales.map(s => [
                  s.invoiceNumber,
                  s.customer?.name || 'N/A',
                  formatDateTime(s.createdAt),
                  s.total,
                  s.paymentStatus,
                  s.amountDue
                ].join(','))
              ].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            className="btn-secondary"
          >
            <Download className="w-5 h-5 mr-2" />
            Download CSV
          </button>
          <Link to="/sales/new" className="btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            New Sale
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.totalSales || 0)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary?.totalPaid || 0)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Amount Due</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary?.totalDue || 0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice number or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input lg:w-48"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No sales found</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        to={`/sales/${sale._id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {sale.invoiceNumber}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {getPaymentMethodLabel(sale.paymentMethod)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.customer?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={getStatusBadge(sale.paymentStatus)}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {sale.amountDue > 0 ? (
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(sale.amountDue)}
                        </span>
                      ) : (
                        <span className="text-sm text-green-600">Paid</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link
                        to={`/sales/${sale._id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg inline-flex"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
