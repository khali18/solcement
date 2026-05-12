import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const SupplierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    category: 'general',
    address: { street: '', city: '', state: '', zipCode: '' },
    paymentTerms: 'immediate',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchSupplier();
    }
  }, [id]);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const response = await apiHelpers.getSupplier(id);
      const supplier = response.data.data.supplier;
      setFormData({
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        phone: supplier.phone,
        category: supplier.category,
        address: {
          street: supplier.address?.street || '',
          city: supplier.address?.city || '',
          state: supplier.address?.state || '',
          zipCode: supplier.address?.zipCode || ''
        },
        paymentTerms: supplier.paymentTerms,
        notes: supplier.notes || ''
      });
    } catch (error) {
      console.error('Error fetching supplier:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (isEditing) {
        await apiHelpers.updateSupplier(id, formData);
      } else {
        await apiHelpers.createSupplier(formData);
      }
      navigate('/suppliers');
    } catch (error) {
      console.error('Error saving supplier:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/suppliers')} className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="label">Company Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="input" required />
          </div>

          <div>
            <label className="label">Contact Person</label>
            <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="label">Phone Number *</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input" required />
          </div>

          <div>
            <label className="label">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="label">Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="input">
              <option value="general">General</option>
              <option value="cement">Cement</option>
              <option value="iron_rods">Iron Rods</option>
              <option value="zinc">Zinc/Roofing</option>
              <option value="paint">Paint</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="label">Payment Terms</label>
            <select name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} className="input">
              <option value="immediate">Immediate</option>
              <option value="15_days">15 Days</option>
              <option value="30_days">30 Days</option>
              <option value="60_days">60 Days</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="label">Street Address</label>
            <input type="text" name="address.street" value={formData.address.street} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="label">City</label>
            <input type="text" name="address.city" value={formData.address.city} onChange={handleChange} className="input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">State</label>
              <input type="text" name="address.state" value={formData.address.state} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label">Zip Code</label>
              <input type="text" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} className="input" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} className="input" rows={3} />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/suppliers')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {isEditing ? 'Update Supplier' : 'Create Supplier'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
