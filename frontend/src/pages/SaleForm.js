import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import { formatCurrency, getUnitLabel } from '../utils/formatters';
import { ArrowLeft, Loader2, Plus, Trash2, Save, ShoppingCart } from 'lucide-react';

const SaleForm = () => {
  const navigate = useNavigate();
  
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    customer: '',
    items: [],
    paymentMethod: 'cash',
    amountPaid: 0,
    discount: 0,
    notes: ''
  });

  const [selectedProduct, setSelectedProduct] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        apiHelpers.getCustomers(),
        apiHelpers.getProducts()
      ]);
      setCustomers(customersRes.data.data);
      setProducts(productsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (!selectedProduct || quantity < 1) return;
    
    const product = products.find(p => p._id === selectedProduct);
    if (!product) return;

    const existingItem = formData.items.find(item => item.product === selectedProduct);
    
    if (existingItem) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.product === selectedProduct
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, {
          product: selectedProduct,
          productName: product.name,
          unit: product.unit,
          quantity: quantity,
          unitPrice: product.sellingPrice,
          availableStock: product.quantity
        }]
      }));
    }
    
    setSelectedProduct('');
    setQuantity(1);
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, quantity: newQuantity } : item
      )
    }));
  };

  const updateItemPrice = (index, newPrice) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, unitPrice: Number(newPrice) } : item
      )
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );
    const total = subtotal - formData.discount;
    return { subtotal, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setSaving(true);
    
    try {
      const saleData = {
        customer: formData.customer,
        items: formData.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        paymentMethod: formData.paymentMethod,
        amountPaid: Number(formData.amountPaid),
        discount: Number(formData.discount),
        notes: formData.notes
      };
      
      const response = await apiHelpers.createSale(saleData);
      navigate(`/sales/${response.data.data._id}`);
    } catch (error) {
      console.error('Error creating sale:', error);
    } finally {
      setSaving(false);
    }
  };

  const { subtotal, total } = calculateTotals();
  const balanceDue = total - Number(formData.amountPaid);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/sales')}
          className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Sale</h1>
          <p className="text-gray-500 mt-1">Create a new sales invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
          <div>
            <label className="label">Select Customer *</label>
            <select
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="input"
              required
            >
              <option value="">Choose a customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} - {customer.phone}
                  {customer.currentCredit > 0 && ` (Debt: GH₵${customer.currentCredit.toLocaleString()})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Items Section */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Products</h3>
          
          {/* Add Item */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                placeholder="Search materials..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="input text-sm"
              />
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="input"
              >
                <option value="">Select a product</option>
                {products
                  .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                  .map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} - {formatCurrency(product.sellingPrice)} 
                    ({product.quantity} {getUnitLabel(product.unit)} in stock)
                  </option>
                ))}
              </select>
            </div>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="input w-32"
              min="1"
              placeholder="Qty"
            />
            <button
              type="button"
              onClick={addItem}
              disabled={!selectedProduct}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Items Table */}
          {formData.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-500">{getUnitLabel(item.unit)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                          className="input w-20 text-center py-1"
                          min="1"
                          max={item.availableStock}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItemPrice(index, e.target.value)}
                          className="input w-32 text-right py-1"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No items added yet</p>
              <p className="text-sm">Select a product and quantity to add items</p>
            </div>
          )}

          {/* Totals */}
          {formData.items.length > 0 && (
            <div className="mt-6 space-y-2 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Discount</span>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                  className="input w-32 text-right py-1"
                  min="0"
                />
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Payment Section */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="input"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            
            <div>
              <label className="label">
                Amount Paid {formData.paymentMethod === 'credit' && '(0 for credit sales)'}
              </label>
              <input
                type="number"
                value={formData.paymentMethod === 'credit' ? 0 : formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                className="input"
                min="0"
                max={total}
                disabled={formData.paymentMethod === 'credit'}
                placeholder={formData.paymentMethod === 'credit' ? 'Amount will be added to customer credit' : 'Enter amount'}
              />
            </div>
          </div>

          {balanceDue > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                Balance Due: <span className="font-bold">{formatCurrency(balanceDue)}</span>
              </p>
              {formData.paymentMethod === 'credit' && (
                <p className="text-xs text-yellow-600 mt-1">
                  This amount will be added to customer's credit balance
                </p>
              )}
            </div>
          )}

          <div className="mt-4">
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={2}
              placeholder="Additional notes about this sale"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          {!formData.customer && (
            <span className="text-sm text-red-500 mr-2">
              * Please select a customer to create invoice
            </span>
          )}
          <button
            type="button"
            onClick={() => navigate('/sales')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || formData.items.length === 0 || !formData.customer}
            className="btn-primary"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
};

export default SaleForm;
