import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import { ArrowLeft, Loader2, Save, Shield, Store, User } from 'lucide-react';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'sales_staff',
    phone: '',
    isActive: true
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await apiHelpers.getUsers();
      const user = response.data.data.find(u => u._id === id);
      if (user) {
        setFormData({
          name: user.name,
          username: user.username,
          password: '',
          role: user.role,
          phone: user.phone || '',
          isActive: user.isActive
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const data = { ...formData };
      if (isEditing && !data.password) {
        delete data.password;
      }
      
      if (isEditing) {
        await apiHelpers.updateUser(id, data);
      } else {
        await apiHelpers.createUser(data);
      }
      navigate('/users');
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setSaving(false);
    }
  };

  const roles = [
    { value: 'admin', label: 'Administrator', icon: Shield, description: 'Full system access' },
    { value: 'store_manager', label: 'Store Manager', icon: Store, description: 'Inventory and supplier management' },
    { value: 'sales_staff', label: 'Sales Staff', icon: User, description: 'Sales and customer management' }
  ];

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
        <button onClick={() => navigate('/users')} className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit User' : 'Add New User'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="label">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">
              {isEditing ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              required={!isEditing}
              minLength={6}
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Role *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <label
                    key={role.value}
                    className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.role === role.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="sr-only"
                    />
                    <Icon className={`w-6 h-6 ${formData.role === role.value ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="mt-2 font-medium text-gray-900">{role.label}</span>
                    <span className="text-xs text-gray-500">{role.description}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {isEditing && (
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active user</span>
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/users')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {isEditing ? 'Update User' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
