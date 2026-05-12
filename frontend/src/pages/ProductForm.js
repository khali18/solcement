import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    unit: 'piece',
    quantity: 0,
    minStockLevel: 10,
    costPrice: '',
    sellingPrice: '',
    location: '',
    notes: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await apiHelpers.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await apiHelpers.getProduct(id);
      const product = response.data.data;
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category,
        unit: product.unit,
        quantity: product.quantity,
        minStockLevel: product.minStockLevel,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        location: product.location || '',
        notes: product.notes || ''
      });
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (isEditing) {
        await apiHelpers.updateProduct(id, formData);
      } else {
        await apiHelpers.createProduct(formData);
      }
      navigate('/products');
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/products')}
          className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing ? 'Update product details' : 'Add a new product to your inventory'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="label">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Dangote Cement 50kg"
              required
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              rows={3}
              placeholder="Brief description of the product"
            />
          </div>

          {/* Category */}
          <div>
            <label className="label">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input"
              required
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className="label">Unit of Measurement *</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="bag">Bag</option>
              <option value="piece">Piece</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="meter">Meter</option>
              <option value="liter">Liter</option>
              <option value="square_meter">Square Meter (m²)</option>
              <option value="cubic_meter">Cubic Meter (m³)</option>
              <option value="roll">Roll</option>
              <option value="set">Set</option>
              <option value="box">Box</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="label">Initial Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="input"
              min="0"
            />
          </div>

          {/* Min Stock Level */}
          <div>
            <label className="label">Minimum Stock Level</label>
            <input
              type="number"
              name="minStockLevel"
              value={formData.minStockLevel}
              onChange={handleChange}
              className="input"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
          </div>

          {/* Cost Price */}
          <div>
            <label className="label">Cost Price (GH₵) *</label>
            <input
              type="number"
              name="costPrice"
              value={formData.costPrice}
              onChange={handleChange}
              className="input"
              min="0"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>

          {/* Selling Price */}
          <div>
            <label className="label">Selling Price (GH₵) *</label>
            <input
              type="number"
              name="sellingPrice"
              value={formData.sellingPrice}
              onChange={handleChange}
              className="input"
              min="0"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>

          {/* Location */}
          <div className="md:col-span-2">
            <label className="label">Storage Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Warehouse A, Shelf 3"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input"
              rows={2}
              placeholder="Additional notes about this product"
            />
          </div>
        </div>

        {/* Profit Preview */}
        {formData.costPrice && formData.sellingPrice && (
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">
              Estimated Profit per Unit: {' '}
              <span className="font-bold">
                GH₵{(formData.sellingPrice - formData.costPrice).toLocaleString()}
              </span>
              {' '}({' '}
              {((formData.sellingPrice - formData.costPrice) / formData.costPrice * 100).toFixed(1)}%
              {' '}margin)
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
