import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import { formatCurrency, formatDate, formatPhone } from '../utils/formatters';
import {
  ArrowLeft,
  Loader2,
  FileText,
  User,
  Phone,
  MapPin,
  CreditCard,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick payment state
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNotes, setPayNotes] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      const [custRes, stmtRes] = await Promise.all([
        apiHelpers.getCustomer(id),
        apiHelpers.getCustomerStatement(id).catch(() => null)
      ]);
      setCustomer(custRes.data.data.customer);
      setSales(custRes.data.data.recentSales || []);
      if (stmtRes) setStatement(stmtRes.data.data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return;
    setPaying(true);
    try {
      await apiHelpers.createCustomerPayment({
        customer: id,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        notes: payNotes || `Manual payment recorded`
      });
      toast.success('Payment recorded successfully!');
      setPayAmount('');
      setPayNotes('');
      fetchCustomerData();
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Failed to record payment');
    } finally {
      setPaying(false);
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
        <User className="w-16 h-16 mx-auto mb-4 text-gray-200" />
        <p className="text-gray-500 font-medium">Customer not found</p>
        <button onClick={() => navigate('/customers')} className="btn-secondary mt-4">Back to Customers</button>
      </div>
    );
  }

  const debtPct = customer.creditLimit > 0
    ? Math.min(100, Math.round((customer.currentCredit / customer.creditLimit) * 100))
    : 0;

  const debtBarColor = debtPct >= 90 ? 'bg-red-500' : debtPct >= 60 ? 'bg-amber-500' : 'bg-emerald-500';

  const typeColors = {
    individual: 'bg-sky-100 text-sky-700',
    contractor: 'bg-purple-100 text-purple-700',
    company: 'bg-blue-100 text-blue-700',
    retailer: 'bg-orange-100 text-orange-700'
  };

  return (
    <div className="space-y-6">

      {/* Print CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .print-hidden { display: none !important; }
          aside, header { display: none !important; }
          .card { border: 1px solid #e2e8f0 !important; box-shadow: none !important; }
          body { background: white !important; }
        }
      ` }} />

      {/* Header */}
      <div className="flex items-center justify-between print-hidden">
        <div className="flex items-center">
          <button onClick={() => navigate('/customers')} className="mr-4 p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${typeColors[customer.type] || 'bg-gray-100 text-gray-600'}`}>
                {customer.type}
              </span>
              {!customer.isActive && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Inactive</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-secondary text-sm">
            <FileText className="w-4 h-4 mr-2" />
            Print Statement
          </button>
          {hasRole(['admin', 'store_manager']) && (
            <Link to={`/customers/${id}/edit`} className="btn-secondary text-sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Top Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Contact</h3>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{formatPhone(customer.phone)}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
            {(customer.address?.street || customer.address?.city) && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>
                  {customer.address?.street && <span>{customer.address.street}<br /></span>}
                  {customer.address?.city}{customer.address?.state && `, ${customer.address.state}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Purchase Summary</h3>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Purchases</span>
              <span className="font-semibold text-gray-900">{formatCurrency(customer.totalPurchases || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Paid</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(customer.totalPaid || 0)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-500 font-medium">Outstanding</span>
              <span className={`font-bold ${customer.currentCredit > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatCurrency(customer.currentCredit || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Credit Limit Card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Credit Limit</h3>
          </div>
          {customer.creditLimit > 0 ? (
            <>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Used</span>
                <span className="font-semibold">{formatCurrency(customer.currentCredit)} / {formatCurrency(customer.creditLimit)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${debtBarColor}`}
                  style={{ width: `${debtPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{debtPct}% used</span>
                <span className="text-emerald-600 font-medium">{formatCurrency(customer.creditLimit - customer.currentCredit)} available</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">No credit limit set</p>
          )}
        </div>
      </div>

      {/* Quick Payment */}
      {hasRole('admin') && customer.currentCredit > 0 && (
        <div className="card p-6 print-hidden border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-semibold text-gray-900">Quick Payment</h3>
            <span className="ml-auto text-sm text-red-600 font-semibold">
              Owes: {formatCurrency(customer.currentCredit)}
            </span>
          </div>
          <form onSubmit={handleQuickPayment} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">GH₵</span>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="input pl-10"
                placeholder="Amount"
                min="1"
                step="0.01"
                required
              />
            </div>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="input sm:w-44">
              <option value="cash">💵 Cash</option>
              <option value="mobile_money">📱 Mobile Money</option>
              <option value="bank_transfer">🏦 Bank Transfer</option>
            </select>
            <input
              type="text"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              className="input flex-1"
              placeholder="Note (optional)"
            />
            <button type="submit" disabled={paying} className="btn-primary whitespace-nowrap px-6">
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Payment'}
            </button>
          </form>
        </div>
      )}

      {/* Transaction History */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
          </div>
          {hasRole('admin') && (
            <Link to={`/customers/${id}/payments`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all payments →
            </Link>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.length > 0 ? (
                sales.map((sale) => {
                  const sConfig = {
                    paid: { icon: CheckCircle, cls: 'bg-emerald-100 text-emerald-700' },
                    partial: { icon: Clock, cls: 'bg-amber-100 text-amber-700' },
                    unpaid: { icon: XCircle, cls: 'bg-red-100 text-red-700' }
                  }[sale.paymentStatus] || { icon: XCircle, cls: 'bg-gray-100 text-gray-600' };
                  const SIcon = sConfig.icon;
                  return (
                    <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/sales/${sale._id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                          {sale.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(sale.total)}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-emerald-600">{formatCurrency(sale.amountPaid)}</td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">
                        <span className={sale.amountDue > 0 ? 'text-red-600' : 'text-emerald-600'}>
                          {sale.amountDue > 0 ? formatCurrency(sale.amountDue) : '✓ Clear'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${sConfig.cls}`}>
                          <SIcon className="w-3 h-3" />
                          {sale.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-400">{formatDate(sale.createdAt)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-gray-400 font-medium">No transactions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {customer.notes && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
          <p className="text-gray-600 text-sm">{customer.notes}</p>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
