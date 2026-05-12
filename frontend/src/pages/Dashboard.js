import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiHelpers } from '../utils/api';
import { formatCurrency, formatNumber, getStockStatusColor } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartRes] = await Promise.all([
        apiHelpers.getDashboardStats(),
        apiHelpers.getSalesChart('month')
      ]);
      
      setStats(statsRes.data.data);
      setChartData(chartRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const allStatCards = [
    {
      id: 'today_sales',
      roles: ['admin', 'sales_staff'],
      title: "Today's Sales",
      value: formatCurrency(stats?.today?.revenue || 0),
      subValue: `${stats?.today?.sales || 0} transactions`,
      icon: DollarSign,
      trend: '+12%',
      trendUp: true,
      color: 'blue'
    },
    {
      id: 'monthly_revenue',
      roles: ['admin', 'sales_staff'],
      title: "Monthly Revenue",
      value: formatCurrency(stats?.monthly?.revenue || 0),
      subValue: `${stats?.monthly?.sales || 0} sales`,
      icon: TrendingUp,
      trend: '+8%',
      trendUp: true,
      color: 'green'
    },
    {
      id: 'total_products',
      roles: ['admin', 'store_manager'],
      title: "Total Products",
      value: formatNumber(stats?.inventory?.totalProducts || 0),
      subValue: `${stats?.inventory?.lowStockCount || 0} low stock`,
      icon: Package,
      trend: stats?.inventory?.lowStockCount > 0 ? 'Attention needed' : 'Good',
      trendUp: stats?.inventory?.lowStockCount === 0,
      color: 'yellow'
    },
    {
      id: 'inventory_value',
      roles: ['admin', 'store_manager'],
      title: "Inventory Value",
      value: formatCurrency(stats?.inventory?.totalValue || 0),
      subValue: `Cost: ${formatCurrency(stats?.inventory?.totalCost || 0)}`,
      icon: DollarSign,
      trend: 'Total assets',
      trendUp: true,
      color: 'emerald'
    },
    {
      id: 'customers',
      roles: ['admin', 'store_manager', 'sales_staff'],
      title: "Customers",
      value: formatNumber(stats?.customers?.total || 0),
      subValue: `${stats?.customers?.withDebt || 0} with debt`,
      icon: Users,
      trend: stats?.customers?.withDebt > 0 ? 'Review needed' : 'Good',
      trendUp: stats?.customers?.withDebt === 0,
      color: 'purple'
    }
  ];

  const statCards = allStatCards.filter(card => hasRole(card.roles));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your business performance</p>
        </div>
        {hasRole(['admin', 'sales_staff']) && (
          <Link to="/sales/new" className="btn-primary">
            <ShoppingCart className="w-5 h-5 mr-2" />
            New Sale
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.subValue}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {stat.trendUp ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

          {/* Charts and tables grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart - Hidden for Manager */}
        {hasRole(['admin', 'sales_staff']) && (
          <div className="card p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="label" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => `GH₵${value/1000}k`}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#2563eb" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Low Stock Alerts - Always visible to Manager and Admin */}
        {hasRole(['admin', 'store_manager']) && (
          <div className={`card p-6 ${!hasRole(['sales_staff']) && user.role === 'store_manager' ? 'lg:col-span-3' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            
            {stats?.lowStockProducts?.length > 0 ? (
              <div className="space-y-3">
                {stats.lowStockProducts.map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">
                        {product.quantity} / {product.minStockLevel} {product.unit}
                      </p>
                    </div>
                    <span className="badge-warning">Low</span>
                  </div>
                ))}
                <Link 
                  to="/products?lowStock=true" 
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700 mt-4"
                >
                  View all low stock items
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>All products are well stocked</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Sales - Hidden for Manager */}
      {hasRole(['admin', 'sales_staff']) && (
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
              <Link to="/sales" className="text-sm text-blue-600 hover:text-blue-700">
                View all
              </Link>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats?.recentSales?.length > 0 ? (
                  stats.recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <Link to={`/sales/${sale.id}`}>{sale.invoiceNumber}</Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`badge-${getStockStatusColor(sale.paymentStatus)}`}>
                          {sale.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {new Date(sale.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No recent sales
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
