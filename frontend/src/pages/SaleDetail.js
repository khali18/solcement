import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import { formatCurrency, formatDateTime, getUnitLabel, getPaymentMethodLabel } from '../utils/formatters';
import { ArrowLeft, Printer, CheckCircle, Loader2, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount) return;

    setAddingPayment(true);
    try {
      const newTotalPaid = sale.amountPaid + Number(paymentAmount);
      await apiHelpers.updatePayment(sale._id, {
        amountPaid: newTotalPaid,
        paymentMethod: 'cash'
      });
      fetchSale();
      setPaymentAmount('');
    } catch (error) {
      console.error('Error adding payment:', error);
    } finally {
      setAddingPayment(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
        <p className="text-gray-500">Sale not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center">
          <button onClick={() => navigate('/sales')} className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice {sale.invoiceNumber}</h1>
            <p className="text-gray-500">{formatDateTime(sale.createdAt)}</p>
          </div>
        </div>
        <button onClick={handlePrint} className="btn-secondary">
          <Printer className="w-5 h-5 mr-2" />
          Print Invoice
        </button>
      </div>

      {/* Invoice Content */}
      <div className="card p-8 print:shadow-none print:border-none">
        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="mb-4">
              <img src="/logo-invoice.svg" alt="SOL CEMENT" className="h-12 mb-2" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">INVOICE</h3>
                <p className="text-gray-600 mt-1">{sale.invoiceNumber}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Date: {formatDateTime(sale.createdAt)}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
              sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
              sale.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {sale.paymentStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
          <p className="font-medium text-gray-900">{sale.customer?.name}</p>
          <p className="text-gray-600">{sale.customer?.phone}</p>
          {sale.customer?.email && <p className="text-gray-600">{sale.customer.email}</p>}
          {sale.deliveryAddress && <p className="text-gray-600 mt-2">Delivery: {sale.deliveryAddress}</p>}
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sale.items.map((item, index) => (
              <tr key={index}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{item.product?.name}</p>
                  <p className="text-xs text-gray-500">{getUnitLabel(item.product?.unit)}</p>
                </td>
                <td className="px-4 py-3 text-center text-gray-900">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-red-600">-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-medium text-green-600">{formatCurrency(sale.amountPaid)}</span>
            </div>
            {sale.amountDue > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Balance Due</span>
                <span className="font-medium text-red-600">{formatCurrency(sale.amountDue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Section */}
        {sale.amountDue > 0 && hasRole(['admin', 'store_manager']) && (
          <div className="mt-8 pt-6 border-t border-gray-200 print:hidden">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Payment</h3>
            <form onSubmit={handleAddPayment} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="label">Payment Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="input pl-10"
                    min="1"
                    max={sale.amountDue}
                    placeholder="Enter amount"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={addingPayment} className="btn-primary">
                {addingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Payment'}
              </button>
            </form>
          </div>
        )}

        {/* Notes */}
        {sale.notes && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h3>
            <p className="text-gray-600">{sale.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p className="font-semibold text-gray-700">SOL CEMENT - AMINU YAKUBU ENTERPRISE</p>
          <p className="mt-1">Build The Future</p>
          <p className="mt-1">Contact: 024 370 1637 / 055 149 4769</p>
          <p className="mt-2">Thank you for your business!</p>
          <p className="mt-1">Payment Method: {getPaymentMethodLabel(sale.paymentMethod)}</p>
        </div>
      </div>
    </div>
  );
};

export default SaleDetail;
