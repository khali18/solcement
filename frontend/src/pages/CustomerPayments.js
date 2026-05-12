import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  ArrowLeft,
  Plus,
  Receipt,
  CreditCard,
  DollarSign,
  Calendar,
  User,
  Loader2,
  Filter,
  TrendingUp,
  Trash2,
  Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerPayments = () => {
  const { id: customerId } = useParams();
  const navigate = useNavigate();
  
  const [payments, setPayments] = useState([]);
  const [outstandingSales, setOutstandingSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [activeTab, setActiveTab] = useState('payments');
  
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: '',
    appliedToSales: []
  });

  useEffect(() => {
    if (customerId) {
      fetchData();
    }
  }, [customerId]);

  const fetchData = async () => {
    try {
      const [paymentsRes, outstandingRes] = await Promise.all([
        apiHelpers.getCustomerPayments({ customer: customerId }),
        apiHelpers.getCustomerOutstandingSales(customerId)
      ]);
      
      setPayments(paymentsRes.data.data);
      setOutstandingSales(outstandingRes.data.data.outstandingSales);
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      const paymentData = {
        customer: customerId,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber,
        notes: formData.notes,
        appliedToSales: formData.appliedToSales
      };

      await apiHelpers.createCustomerPayment(paymentData);
      
      // Reset form
      setFormData({
        amount: '',
        paymentMethod: 'cash',
        referenceNumber: '',
        notes: '',
        appliedToSales: []
      });
      setShowPaymentForm(false);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Error creating payment');
    }
  };

  const handleDelete = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment? This will revert the customer balance and sale statuses.')) {
      try {
        await apiHelpers.deleteCustomerPayment(paymentId);
        toast.success('Payment deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete payment');
      }
    }
  };

  const totalOutstanding = outstandingSales.reduce((sum, sale) => sum + sale.amountDue, 0);

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="card p-4">
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-lg bg-${color}-100 flex items-center justify-center mr-3`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(value)}</p>
          {change && (
            <p className={`text-xs ${change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {change > 0 ? '+' : ''}{formatCurrency(Math.abs(change))}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(`/customers/${customerId}`)}
          className="mr-4 p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Payments</h1>
          <p className="text-slate-500 mt-1">Record and manage customer payments</p>
        </div>
      </div>

      {/* Customer Info */}
      {outstandingSales.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total Outstanding"
            value={totalOutstanding}
            icon={DollarSign}
            color="rose"
          />
          <StatCard
            title="Outstanding Sales"
            value={outstandingSales.length}
            icon={TrendingUp}
            color="amber"
          />
        </div>
      )}

      {/* Outstanding Sales */}
      {outstandingSales.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Outstanding Sales</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Invoice</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Amount Due</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {outstandingSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Receipt className="w-4 h-4 text-slate-400 mr-2" />
                        <span className="font-medium text-slate-900">{sale.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {formatCurrency(sale.amountDue)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-danger">Unpaid</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-slate-200">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-b-2 border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Receipt className="w-4 h-4 mr-2" />
              Payment History
            </button>
            <button
              onClick={() => setActiveTab('new-payment')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'new-payment'
                  ? 'border-b-2 border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </button>
          </div>
        </div>

        {/* Payment History Tab */}
        {activeTab === 'payments' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-900">Payment History</h3>
              <button
                onClick={() => setActiveTab('new-payment')}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Record Payment
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Receipt #</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Method</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Applied To</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center">
                          <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p className="text-slate-500">No payments recorded yet</p>
                          <p className="text-sm text-slate-400">Click "Record Payment" to add a payment</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Receipt className="w-4 h-4 text-slate-400 mr-2" />
                            <span className="font-medium text-slate-900">{payment.receiptNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDateTime(payment.paymentDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${
                            payment.paymentMethod === 'cash' ? 'badge-success' :
                            payment.paymentMethod === 'bank_transfer' ? 'badge-info' :
                            payment.paymentMethod === 'mobile_money' ? 'badge-warning' :
                            'badge-gray'
                          }`}>
                            {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3">
                          {payment.appliedToSales.length > 0 ? (
                            <div className="space-y-1">
                              {payment.appliedToSales.map((applied, index) => (
                                <div key={index} className="text-xs text-slate-600">
                                  <span className="font-medium">{applied.sale.invoiceNumber}</span>
                                  <span> ({formatCurrency(applied.amountApplied)})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleDelete(payment._id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete Payment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* New Payment Form Tab */}
        {activeTab === 'new-payment' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Record New Payment</h3>
            
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Payment Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input"
                    placeholder="Enter payment amount"
                    required
                  />
                </div>

                <div>
                  <label className="label">Payment Method *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="check">Check</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Reference Number</label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  className="input"
                  placeholder="Check number, transaction ID, etc."
                />
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Additional notes about this payment"
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('payments')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPayments;
