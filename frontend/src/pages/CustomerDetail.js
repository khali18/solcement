import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import { formatCurrency, formatDate, formatPhone } from '../utils/formatters';
import { ArrowLeft, Loader2, FileText, User, Phone, MapPin, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      const response = await apiHelpers.getCustomer(id);
      setCustomer(response.data.data.customer);
      setSales(response.data.data.recentSales);
      
      // Fetch statement
      const stmtResponse = await apiHelpers.getCustomerStatement(id);
      setStatement(stmtResponse.data.data);
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/customers')} className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <span className="badge-gray capitalize mt-1">{customer.type}</span>
        </div>
        {hasRole(['admin', 'store_manager']) && (
          <div className="flex gap-2 print:hidden">
            <button 
              onClick={() => window.print()}
              className="btn-secondary"
            >
              <FileText className="w-5 h-5 mr-2" />
              Print Statement
            </button>
            <Link to={`/customers/${id}/edit`} className="btn-secondary">
              Edit Customer
            </Link>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .btn-primary, .btn-secondary, .sidebar, .topbar, .badge-gray, .print\\:hidden {
            display: none !important;
          }
          .card {
            border: none !important;
            box-shadow: none !important;
          }
          body {
            background: white !important;
          }
          .max-w-7xl {
            max-width: 100% !important;
            padding: 0 !important;
          }
        }
      `}} />

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">Contact Info</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{formatPhone(customer.phone)}</p>
            {customer.email && <p className="text-sm text-gray-600">{customer.email}</p>}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900">Address</h3>
          </div>
          <div className="space-y-1">
            {customer.address?.street && <p className="text-sm text-gray-600">{customer.address.street}</p>}
            {customer.address?.city && (
              <p className="text-sm text-gray-600">
                {customer.address.city}{customer.address.state && `, ${customer.address.state}`}
              </p>
            )}
            {!customer.address?.street && !customer.address?.city && (
              <p className="text-sm text-gray-500">No address on file</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900">Credit Info</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Credit Limit:</span>
              <span className="font-medium">{formatCurrency(customer.creditLimit)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Debt:</span>
              <span className={`font-medium ${customer.currentCredit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(customer.currentCredit)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Available:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(customer.creditLimit - customer.currentCredit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Summary */}
      {statement && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">Total Purchases</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(statement.summary.totalPurchases)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(statement.summary.totalPaid)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600">Outstanding</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(statement.summary.totalBalance)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/sales/${sale._id}`} className="text-blue-600 hover:text-blue-700 font-medium">
                        {sale.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(sale.total)}</td>
                    <td className="px-6 py-4 text-right text-green-600">{formatCurrency(sale.amountPaid)}</td>
                    <td className="px-6 py-4 text-right text-red-600">{formatCurrency(sale.amountDue)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`badge-${sale.paymentStatus === 'paid' ? 'success' : sale.paymentStatus === 'partial' ? 'warning' : 'danger'}`}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {formatDate(sale.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Actions */}
      {hasRole('admin') && (
        <div className="card mt-6">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Payment Actions</h3>
          </div>
          <div className="p-6 space-y-4">
            <Link
              to={`/customers/${id}/payments`}
              className="btn-primary w-full justify-center"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Record Payment
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
