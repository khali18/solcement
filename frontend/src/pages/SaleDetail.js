import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import { formatCurrency, formatDateTime, getUnitLabel, getPaymentMethodLabel } from '../utils/formatters';
import {
  ArrowLeft,
  Printer,
  Loader2,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  User,
  Package,
  FileText,
  Banknote,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusConfig = {
  paid: { label: 'Paid', icon: CheckCircle, cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  partial: { label: 'Partial Payment', icon: Clock, cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
  unpaid: { label: 'Unpaid', icon: XCircle, cls: 'bg-red-100 text-red-700 border border-red-200' }
};

const SaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [addingPayment, setAddingPayment] = useState(false);

  useEffect(() => {
    fetchSale();
  }, [id]);

  const fetchSale = async () => {
    try {
      const response = await apiHelpers.getSale(id);
      setSale(response.data.data);
    } catch (error) {
      console.error('Error fetching sale:', error);
      toast.error('Failed to load sale details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    if (Number(paymentAmount) > sale.amountDue) {
      toast.error(`Payment cannot exceed balance due (${formatCurrency(sale.amountDue)})`);
      return;
    }

    setAddingPayment(true);
    try {
      const newTotalPaid = sale.amountPaid + Number(paymentAmount);
      await apiHelpers.updatePayment(sale._id, {
        amountPaid: newTotalPaid,
        paymentMethod
      });
      toast.success('Payment recorded successfully!');
      fetchSale();
      setPaymentAmount('');
      setPaymentMethod('cash');
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setAddingPayment(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-200" />
        <p className="text-gray-500 font-medium">Sale not found</p>
        <button onClick={() => navigate('/sales')} className="btn-secondary mt-4">Back to Sales</button>
      </div>
    );
  }

  const status = statusConfig[sale.paymentStatus] || statusConfig.unpaid;
  const StatusIcon = status.icon;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Non-print header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center">
          <button onClick={() => navigate('/sales')} className="mr-4 p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{sale.invoiceNumber}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{formatDateTime(sale.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${status.cls}`}>
            <StatusIcon className="w-4 h-4" />
            {status.label}
          </span>
          <button onClick={handlePrint} className="btn-secondary">
            <Printer className="w-5 h-5 mr-2" />
            Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="card print:shadow-none print:border-none">

        {/* Invoice Header */}
        <div className="p-8 border-b border-gray-100 print:pb-6">
          <div className="flex justify-between items-start">
            <div>
              <img src="/logo-invoice.svg" alt="SOL CEMENT" className="h-12 mb-3" onError={(e) => { e.target.style.display='none'; }} />
              <div>
                <p className="text-lg font-bold text-gray-900">SOL CEMENT</p>
                <p className="text-sm text-gray-500">AMINU YAKUBU ENTERPRISE</p>
                <p className="text-sm text-gray-500 mt-1">Tel: 024 370 1637 / 055 149 4769</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-black text-gray-200 uppercase tracking-widest print:text-gray-800">INVOICE</h2>
              <p className="text-gray-600 font-semibold mt-1">{sale.invoiceNumber}</p>
              <p className="text-sm text-gray-500 mt-1">{formatDateTime(sale.createdAt)}</p>
              <span className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-bold ${status.cls}`}>
                <StatusIcon className="w-3 h-3" />
                {status.label.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Bill To + Sale Info */}
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill To</h3>
            </div>
            <p className="font-semibold text-gray-900">{sale.customer?.name}</p>
            <p className="text-sm text-gray-600 mt-0.5">{sale.customer?.phone}</p>
            {sale.customer?.email && <p className="text-sm text-gray-600">{sale.customer.email}</p>}
            {sale.customer?.address?.street && <p className="text-sm text-gray-500 mt-1">{sale.customer.address.street}</p>}
            {sale.deliveryAddress && <p className="text-sm text-gray-500 mt-1">📦 {sale.deliveryAddress}</p>}
          </div>
          <div className="sm:text-right">
            <div className="flex items-center gap-2 mb-3 sm:justify-end">
              <FileText className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sale Info</h3>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex sm:justify-end gap-2">
                <span className="text-gray-500">Payment:</span>
                <span className="font-medium text-gray-900">{getPaymentMethodLabel(sale.paymentMethod)}</span>
              </div>
              {sale.salesPerson?.name && (
                <div className="flex sm:justify-end gap-2">
                  <span className="text-gray-500">Staff:</span>
                  <span className="font-medium text-gray-900">{sale.salesPerson.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-gray-400" />
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</h3>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sale.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.product?.name}</p>
                      <p className="text-xs text-gray-400">{getUnitLabel(item.product?.unit)}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Discount</span>
                  <span className="font-medium text-red-500">-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Amount Paid</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(sale.amountPaid)}</span>
              </div>
              {sale.amountDue > 0 && (
                <div className="flex justify-between text-sm font-bold text-red-600 pt-1 border-t border-red-100">
                  <span>Balance Due</span>
                  <span>{formatCurrency(sale.amountDue)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Payment Section (admin/manager only, non-print) */}
        {sale.amountDue > 0 && hasRole(['admin', 'store_manager']) && (
          <div className="p-8 border-b border-gray-100 bg-slate-50/50 print:hidden">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-semibold text-gray-900">Record Additional Payment</h3>
              <span className="ml-auto text-sm text-red-600 font-semibold">
                Balance: {formatCurrency(sale.amountDue)}
              </span>
            </div>
            <form onSubmit={handleAddPayment} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="label">Amount (GH₵)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="input pl-9"
                    min="1"
                    max={sale.amountDue}
                    step="0.01"
                    placeholder="Enter amount"
                    required
                  />
                </div>
              </div>
              <div className="w-full sm:w-52">
                <label className="label">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="mobile_money">📱 Mobile Money</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={addingPayment}
                className="btn-primary h-[42px] px-6 whitespace-nowrap"
              >
                {addingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Record Payment'}
              </button>
            </form>
          </div>
        )}

        {/* Notes */}
        {sale.notes && (
          <div className="p-8 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
            <p className="text-gray-600 text-sm">{sale.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="p-8 text-center text-sm text-gray-400">
          <p className="font-semibold text-gray-600">SOL CEMENT - AMINU YAKUBU ENTERPRISE</p>
          <p className="mt-1">Build The Future &bull; Tel: 024 370 1637 / 055 149 4769</p>
          <p className="mt-2 font-medium text-gray-500">Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
};

export default SaleDetail;
