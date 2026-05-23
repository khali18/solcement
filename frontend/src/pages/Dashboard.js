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
  Loader2,
  Star,
  Calendar,
  Minus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';

const TrendBadge = ({ value }) => {
  if (value === 0) return (
    <span className="flex items-center text-sm text-slate-500">
      <Minus className="w-4 h-4 mr-1" /> Same as last month
    </span>
  );
  const isUp = value > 0;
  return (
    <span className={`flex items-center text-sm font-medium ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
      {isUp ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
      {isUp ? '+' : ''}{value}% vs last month
    </span>
  );
};

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('month');
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchChartData(chartPeriod);
  }, [chartPeriod]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartRes, topRes] = await Promise.all([
        apiHelpers.getDashboardStats(),
        apiHelpers.getSalesChart('month'),
        apiHelpers.getTopProducts()
      ]);
      
      setStats(statsRes.data.data);
      setChartData(chartRes.data.data);
      setTopProducts(topRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async (period) => {
    setChartLoading(true);
    try {
      const res = await apiHelpers.getSalesChart(period);
      setChartData(res.data.data);
    } catch (err) {
      console.error('Chart fetch failed:', err);
    } finally {
      setChartLoading(false);
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
      subValue: `${stats?.today?.sales || 0} transaction${stats?.today?.sales !== 1 ? 's' : ''}`,
      icon: DollarSign,
      trendEl: null,
      color: 'blue',
      href: '/sales'
    },
    {
      id: 'monthly_revenue',
      roles: ['admin', 'sales_staff'],
      title: "Monthly Revenue",
      value: formatCurrency(stats?.monthly?.revenue || 0),
      subValue: `${stats?.monthly?.sales || 0} sales`,
      icon: TrendingUp,
      trendEl: <TrendBadge value={stats?.monthly?.revenueTrend ?? 0} />,
      color: 'emerald',
      href: '/sales'
    },
    {
      id: 'total_products',
      roles: ['admin', 'store_manager'],
      title: "Total Products",
      value: formatNumber(stats?.inventory?.totalProducts || 0),
      subValue: `${stats?.inventory?.lowStockCount || 0} low stock`,
      icon: Package,
      trendEl: stats?.inventory?.lowStockCount > 0
        ? <span className="flex items-center text-sm text-amber-600"><AlertTriangle className="w-4 h-4 mr-1" />Needs attention</span>
        : <span className="flex items-center text-sm text-emerald-600"><TrendingUp className="w-4 h-4 mr-1" />All stocked</span>,
      color: 'yellow',
      href: '/products'
    },
    {
      id: 'inventory_value',
      roles: ['admin', 'store_manager'],
      title: "Inventory Value",
      value: formatCurrency(stats?.inventory?.totalValue || 0),
      subValue: `Cost: ${formatCurrency(stats?.inventory?.totalCost || 0)}`,
      icon: DollarSign,
      trendEl: <span className="text-sm text-slate-500">Current stock value</span>,
      color: 'indigo',
      href: '/products'
    },
    {
      id: 'customers',
      roles: ['admin', 'store_manager', 'sales_staff'],
      title: "Customers",
      value: formatNumber(stats?.customers?.total || 0),
      subValue: `${stats?.customers?.withDebt || 0} with debt`,
      icon: Users,
      trendEl: stats?.customers?.withDebt > 0
        ? <span className="flex items-center text-sm text-red-500"><AlertTriangle className="w-4 h-4 mr-1" />{formatCurrency(stats?.customers?.totalDebt || 0)} owed</span>
        : <span className="flex items-center text-sm text-emerald-600"><TrendingUp className="w-4 h-4 mr-1" />No outstanding debt</span>,
      color: 'purple',
      href: '/customers'
    }
  ];

  const statCards = allStatCards.filter(card => hasRole(card.roles));
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    yellow: 'bg-amber-100 text-amber-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            👋 Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening in your store today</p>
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
          <Link key={index} to={stat.href} className="card p-6 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-0.5">{stat.subValue}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${colorMap[stat.color]}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              {stat.trendEl}
            </div>
          </Link>
        ))}
      </div>

      {/* Charts and tables grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        {hasRole(['admin', 'sales_staff']) && (
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                {['week', 'month', 'year'].map(p => (
                  <button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                      chartPeriod === p
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72 relative">
              {chartLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '13px' }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.revenue > 0 ? '#3b82f6' : '#e2e8f0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Low Stock Alerts */}
        {hasRole(['admin', 'store_manager']) && (
          <div className={`card p-6 ${user?.role === 'store_manager' && !hasRole(['sales_staff']) ? 'lg:col-span-1' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Low Stock</h3>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            {stats?.lowStockProducts?.length > 0 ? (
              <div className="space-y-2">
                {stats.lowStockProducts.map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.quantity} / {product.minStockLevel} {product.unit}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Low</span>
                  </div>
                ))}
                <Link to="/products" className="flex items-center text-sm text-blue-600 hover:text-blue-700 mt-3 font-medium">
                  View inventory <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="font-medium">All products are well stocked</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom row: Recent Sales + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        {hasRole(['admin', 'sales_staff']) && (
          <div className="card lg:col-span-2">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
              <Link to="/sales" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats?.recentSales?.length > 0 ? (
                    stats.recentSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          <Link to={`/sales/${sale.id}`}>{sale.invoiceNumber}</Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sale.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{formatCurrency(sale.total)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            sale.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            sale.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {sale.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-right">
                          {new Date(sale.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                        <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                        No recent sales
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Products */}
        {topProducts.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div className="space-y-3">
              {topProducts.slice(0, 6).map((p, i) => {
                const maxQty = topProducts[0]?.totalQuantity || 1;
                const pct = Math.round((p.totalQuantity / maxQty) * 100);
                return (
                  <div key={p._id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-medium text-gray-800 truncate max-w-[120px]" title={p.name}>{p.name}</span>
                      </div>
                      <span className="text-gray-500 text-xs flex-shrink-0">{p.totalQuantity} sold</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
