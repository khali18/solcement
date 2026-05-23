import React, { useEffect, useState } from 'react';
import { apiHelpers } from '../utils/api';
import { formatCurrency, getUnitLabel } from '../utils/formatters';
import { Calculator, Plus, Trash2, Printer, ShoppingCart, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EstimateCalculator = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);

  const [selectedProduct, setSelectedProduct] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await apiHelpers.getProducts();
      setProducts(res.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (!selectedProduct || quantity <= 0) return;
    
    const product = products.find(p => p._id === selectedProduct);
    if (!product) return;

    const existingItem = items.find(item => item.product === selectedProduct);
    
    if (existingItem) {
      setItems(items.map(item =>
        item.product === selectedProduct
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setItems([...items, {
        product: selectedProduct,
        productName: product.name,
        unit: product.unit,
        quantity: quantity,
        unitPrice: product.sellingPrice,
      }]);
    }
    
    setSelectedProduct('');
    setProductSearch('');
    setQuantity(1);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    setItems(items.map((item, i) =>
      i === index ? { ...item, quantity: newQuantity } : item
    ));
  };

  const updateItemPrice = (index, newPrice) => {
    if (newPrice < 0) return;
    setItems(items.map((item, i) =>
      i === index ? { ...item, unitPrice: Number(newPrice) } : item
    ));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const total = subtotal - discount;
    return { subtotal, total };
  };

  const handlePrint = () => {
    if (items.length === 0) {
      toast.error('Please add items to the estimate before printing');
      return;
    }
    window.print();
  };

  const { subtotal, total } = calculateTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Non-printable Header */}
      <div className="print:hidden flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-600" />
            Estimate Calculator
          </h1>
          <p className="text-gray-500 mt-1">Generate a quick price estimate without saving a sale.</p>
        </div>
        <button
          onClick={handlePrint}
          className="btn-primary flex items-center shadow-lg hover:shadow-emerald-500/20"
        >
          <Printer className="w-5 h-5 mr-2" />
          Print Estimate
        </button>
      </div>

      {/* Printable Estimate Document */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
        
        {/* Print Header (Visible only when printing or as part of the card) */}
        <div className="p-8 border-b border-slate-200 bg-slate-50 print:bg-white print:border-b-2 print:border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center print:border print:border-slate-300">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">SOL CEMENT</h2>
              </div>
              <p className="text-sm text-slate-500 font-medium">Build The Future</p>
              <div className="mt-4 text-sm text-slate-600 space-y-1">
                <p>123 Business Avenue</p>
                <p>Accra, Ghana</p>
                <p>Tel: +233 24 123 4567</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-slate-200 print:text-slate-800 uppercase tracking-widest mb-2">ESTIMATE</h1>
              <p className="text-sm text-slate-500">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-sm text-slate-500">Valid for 7 days</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-1 print:hidden">
              Customer Name (Optional)
            </label>
            <input
              type="text"
              placeholder="Enter customer name for the printout..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input max-w-md print:hidden"
            />
            <div className="hidden print:block">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Prepared For:</h3>
              <p className="text-lg font-medium text-slate-900">{customerName || 'Walk-In Customer'}</p>
            </div>
          </div>
        </div>

        {/* Calculator Inputs (Hidden when printing) */}
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 print:hidden">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 relative">
              <label className="text-sm font-medium text-slate-700">Search Product</label>
              <input
                type="text"
                placeholder="Type to filter..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="input text-sm mb-2"
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
                  </option>
                ))}
              </select>
            </div>
            <div className="w-32 space-y-2">
              <label className="text-sm font-medium text-slate-700">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="input"
                min="1"
              />
            </div>
            <button
              type="button"
              onClick={addItem}
              disabled={!selectedProduct}
              className="btn-primary h-[42px] px-6"
            >
              <Plus className="w-5 h-5 mr-1" /> Add
            </button>
          </div>
        </div>

        {/* Estimate Items */}
        <div className="p-6 print:p-8">
          {items.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 print:border-none print:rounded-none">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 print:bg-slate-100 print:border-slate-800">
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Description</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Qty</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Unit Price</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors print:hover:bg-transparent">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{item.productName}</p>
                        <p className="text-xs text-slate-500">{getUnitLabel(item.unit)}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                          className="w-16 text-center bg-transparent border border-slate-200 rounded px-2 py-1 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none print:hidden"
                          min="1"
                        />
                        <span className="hidden print:inline">{item.quantity}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 print:hidden">
                          <span className="text-slate-400 text-sm">GH₵</span>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItemPrice(index, e.target.value)}
                            className="w-24 text-right bg-transparent border border-slate-200 rounded px-2 py-1 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <span className="hidden print:inline">{formatCurrency(item.unitPrice)}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                      <td className="py-3 px-4 text-center print:hidden">
                        <button
                          onClick={() => removeItem(index)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
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
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 print:hidden">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 font-medium">No items added to the estimate yet</p>
              <p className="text-sm text-slate-400 mt-1">Select a product and quantity to begin calculating</p>
            </div>
          )}

          {/* Totals Section */}
          {items.length > 0 && (
            <div className="mt-8 flex justify-end">
              <div className="w-full sm:w-80 space-y-3">
                <div className="flex justify-between text-sm text-slate-600 px-4">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-600 px-4 print:hidden">
                  <span>Discount</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">GH₵</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-24 text-right border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                {discount > 0 && (
                  <div className="hidden print:flex justify-between text-sm text-slate-600 px-4">
                    <span>Discount</span>
                    <span className="font-medium text-rose-600">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold text-slate-900 p-4 bg-slate-50 rounded-xl border border-slate-100 print:bg-transparent print:border-none print:border-t-2 print:border-slate-800 print:rounded-none print:px-0">
                  <span>Estimated Total</span>
                  <span className="text-emerald-600 print:text-slate-900">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Print Footer */}
          <div className="hidden print:block mt-16 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
            <p className="mb-2">Thank you for choosing SOL CEMENT.</p>
            <p>Note: This is an estimate, not a final invoice. Prices and availability are subject to change.</p>
          </div>
        </div>
      </div>
      
      {/* Print CSS Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:inline {
            display: inline !important;
          }
          .max-w-4xl {
            max-w: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* This selects the specific card containing our document */
          .bg-white.rounded-xl.shadow-sm, 
          .bg-white.rounded-xl.shadow-sm * {
            visibility: visible;
          }
          .bg-white.rounded-xl.shadow-sm {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />
    </div>
  );
};

export default EstimateCalculator;
