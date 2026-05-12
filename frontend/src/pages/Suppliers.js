import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import { formatCurrency, formatPhone } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  Truck,
  Loader2,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

const Suppliers = () => {
  const { hasRole } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = search ? { search } : {};
      const response = await apiHelpers.getSuppliers(params);
      setSuppliers(response.data.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      await apiHelpers.deleteSupplier(id);
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-500 mt-1">Manage your suppliers and purchases</p>
        </div>
        {hasRole(['admin', 'store_manager']) && (
          <Link to="/suppliers/new" className="btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            Add Supplier
          </Link>
        )}
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Purchases</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No suppliers found</p>
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-green-700">
                            {supplier.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                          {supplier.contactPerson && (
                            <p className="text-xs text-gray-500">Contact: {supplier.contactPerson}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatPhone(supplier.phone)}</div>
                      {supplier.email && <div className="text-xs text-gray-500">{supplier.email}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="badge-gray capitalize">{supplier.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(supplier.totalPurchases)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {supplier.totalPurchases - supplier.totalPaid > 0 ? (
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(supplier.totalPurchases - supplier.totalPaid)}
                        </span>
                      ) : (
                        <span className="text-sm text-green-600">Paid</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {hasRole(['admin', 'store_manager']) && (
                          <Link
                            to={`/suppliers/${supplier._id}/edit`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                        {hasRole('admin') && (
                          <button
                            onClick={() => handleDelete(supplier._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Suppliers;
