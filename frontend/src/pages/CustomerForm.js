import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'individual',
    creditLimit: 0,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await apiHelpers.getCustomer(id);
      const customer = response.data.data.customer;
      setFormData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone,
        type: customer.type,
        creditLimit: customer.creditLimit,
        address: {
          street: customer.address?.street || '',
          city: customer.address?.city || '',
          state: customer.address?.state || '',
          zipCode: customer.address?.zipCode || ''
        },
        notes: customer.notes || ''
      });
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      if (isEditing) {
        await apiHelpers.updateCustomer(id, formData);
      } else {
        await apiHelpers.createCustomer(formData);
      }
      navigate('/customers');
    } catch (error) {
      console.error('Error saving customer:', error);
      setError(error.response?.data?.message || 'Failed to save customer. Please check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    }
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
          onClick={() => navigate('/customers')}
          className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Customer' : 'Add New Customer'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing ? 'Update customer details' : 'Add a new customer to your database'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="label">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              placeholder="e.g., John Doe"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="label">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input"
              placeholder="e.g., 08012345678"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              placeholder="e.g., john@example.com"
            />
          </div>

          {/* Type */}
          <div>
            <label className="label">Customer Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input"
            >
              <option value="individual">Individual</option>
              <option value="contractor">Contractor</option>
              <option value="company">Company</option>
              <option value="retailer">Retailer</option>
            </select>
          </div>

          {/* Credit Limit */}
          <div>
            <label className="label">Credit Limit (₦)</label>
            <input
              type="number"
              name="creditLimit"
              value={formData.creditLimit}
              onChange={handleChange}
              className="input"
              min="0"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum amount this customer can owe</p>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="label">Street Address</label>
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              className="input"
              placeholder="e.g., 123 Main Street"
            />
          </div>

          <div>
            <label className="label">City</label>
            <input
              type="text"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Lagos"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">State</label>
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Lagos"
              />
            </div>
            <div>
              <label className="label">Zip Code</label>
              <input
                type="text"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
                className="input"
                placeholder="e.g., 100001"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input"
              rows={3}
              placeholder="Additional notes about this customer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/customers')}
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
            {isEditing ? 'Update Customer' : 'Create Customer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
