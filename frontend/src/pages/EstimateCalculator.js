import React, { useEffect, useState } from 'react';
import { apiHelpers } from '../utils/api';
import { formatCurrency, getUnitLabel } from '../utils/formatters';
import { Calculator, Plus, Trash2, Printer, ShoppingCart, Loader2, Search, FileText } from 'lucide-react';
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
    toast.success('Item added to estimate');
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
    const total = Math.max(0, subtotal - discount);
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
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-emerald-600" />
            </div>
            Estimate Calculator
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Generate a quick price estimate without saving to the database.</p>
        </div>
        <button
          onClick={handlePrint}
          className="btn-primary flex items-center shadow-lg shadow-blue-500/20"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Document
        </button>
      </div>

      {/* Main Document Container */}
      <div className="card print:border-none print:shadow-none print:m-0 print:p-0">
        
        {/* Printable Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 print:bg-white print:border-b-2 print:border-slate-800 print:pb-6">
          <div className="flex justify-between items-start">
            <div>
              <img src="/logo-invoice.svg" alt="SOL CEMENT" className="h-12 mb-3" onError={(e) => { e.target.style.display='none'; }} />
              <div>
                <p className="text-lg font-bold text-slate-900">SOL CEMENT</p>
                <p className="text-sm text-slate-500 font-medium">AMINU YAKUBU ENTERPRISE</p>
                <p className="text-sm text-slate-500 mt-1">Tel: 024 370 1637 / 055 149 4769</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black text-slate-200 print:text-slate-800 uppercase tracking-widest mb-2">ESTIMATE</h1>
              <p className="text-sm font-medium text-slate-500">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-sm font-medium text-emerald-600 mt-1">Valid for 7 days</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 print:border-slate-200">
            <div className="max-w-md">
              <div className="flex items-center gap-2 mb-2 print:hidden">
                <FileText className="w-4 h-4 text-slate-400" />
                <label className="text-sm font-semibold text-slate-700">Prepared For (Optional)</label>
              </div>
              <input
                type="text"
                placeholder="Enter customer name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input print:hidden bg-white"
              />
              <div className="hidden print:block">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Prepared For</h3>
                <p className="text-lg font-bold text-slate-900">{customerName || 'Walk-In Customer'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Selector (Hidden when printing) */}
        <div className="p-8 border-b border-slate-100 bg-white print:hidden">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Add Items</h3>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="input pl-10 mb-3"
                />
              </div>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="input bg-slate-50"
              >
                <option value="">Select a product from inventory</option>
                {products
                  .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                  .map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} — {formatCurrency(product.sellingPrice)} 
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-32 space-y-2">
              <label className="text-sm font-medium text-slate-700">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="input bg-slate-50"
                min="1"
              />
            </div>
            <button
              type="button"
              onClick={addItem}
              disabled={!selectedProduct}
              className="btn-secondary h-[42px] px-6 w-full md:w-auto flex-shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Item
            </button>
          </div>
        </div>

        {/* Estimate Items Table */}
        <div className="p-8">
          {items.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-100 print:border-none print:rounded-none">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-100 print:border-slate-800">
                    <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="py-3.5 px-5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                    <th className="py-3.5 px-5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Price</th>
                    <th className="py-3.5 px-5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                    <th className="py-3.5 px-5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 print:divide-slate-200">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors print:hover:bg-transparent">
                      <td className="py-4 px-5">
                        <p className="font-semibold text-slate-900">{item.productName}</p>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">{getUnitLabel(item.unit)}</p>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex justify-center print:hidden">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                            className="w-20 text-center bg-white border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                            min="1"
                          />
                        </div>
                        <span className="hidden print:inline font-medium text-slate-800">{item.quantity}</span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 print:hidden">
                          <span className="text-slate-400 text-sm font-medium">GH₵</span>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItemPrice(index, e.target.value)}
                            className="w-28 text-right bg-white border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <span className="hidden print:inline text-slate-700">{formatCurrency(item.unitPrice)}</span>
                      </td>
                      <td className="py-4 px-5 text-right font-semibold text-slate-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                      <td className="py-4 px-5 text-center print:hidden">
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove item"
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
            <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 print:hidden">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 font-semibold text-lg">Your estimate is empty</p>
              <p className="text-sm text-slate-400 mt-1">Search and add products above to start calculating</p>
            </div>
          )}

          {/* Totals Section */}
          {items.length > 0 && (
            <div className="mt-8 flex justify-end">
              <div className="w-full sm:w-80 space-y-3">
                <div className="flex justify-between text-sm font-medium text-slate-600 px-4">
                  <span>Subtotal</span>
                  <span className="text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm font-medium text-slate-600 px-4 print:hidden">
                  <span>Discount</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">GH₵</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-28 text-right bg-white border border-slate-200 rounded-md px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {discount > 0 && (
                  <div className="hidden print:flex justify-between text-sm font-medium text-slate-600 px-4">
                    <span>Discount</span>
                    <span className="text-rose-600">-{formatCurrency(discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-lg font-bold text-slate-900 p-4 bg-slate-50 rounded-xl border border-slate-100 print:bg-transparent print:border-none print:border-t-2 print:border-slate-800 print:rounded-none print:px-0 mt-4">
                  <span>Estimated Total</span>
                  <span className="text-blue-600 print:text-slate-900">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Print Footer */}
          <div className="hidden print:block mt-16 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">Thank you for considering SOL CEMENT.</p>
            <p>Note: This is a price estimate only, not a formal invoice. Prices and availability are subject to change.</p>
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
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Card override for printing */
          .card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            visibility: visible;
          }
          .card * {
            visibility: visible;
          }
        }
      `}} />
    </div>
  );
};

export default EstimateCalculator;
