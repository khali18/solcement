const { Sale, Purchase, Product, Customer, Transaction } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Define filter based on user role
  const matchFilter = {};
  if (req.user.role !== 'admin') {
    matchFilter.salesPerson = req.user._id;
  }

  // Today's sales
  const todaySales = await Sale.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'cancelled' },
        ...matchFilter
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: '$total' },
        paid: { $sum: '$amountPaid' }
      }
    }
  ]);

  // Monthly sales
  const monthlySales = await Sale.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        status: { $ne: 'cancelled' },
        ...matchFilter
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: '$total' },
        paid: { $sum: '$amountPaid' }
      }
    }
  ]);

  // Last month sales (for trend comparison)
  const now = new Date();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const lastMonthlySales = await Sale.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        status: { $ne: 'cancelled' },
        ...matchFilter
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: '$total' }
      }
    }
  ]);

  // Inventory stats (Global - keep as is or filter? Usually inventory is global)
  const totalProducts = await Product.countDocuments({ isActive: true });
  const lowStockProducts = await Product.countDocuments({
    isActive: true,
    $expr: { $lte: ['$quantity', '$minStockLevel'] }
  });
  const outOfStockProducts = await Product.countDocuments({
    isActive: true,
    quantity: 0
  });

  // Inventory value (Global)
  const inventoryValue = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalCost: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
        totalValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } }
      }
    }
  ]);

  // Customer stats - Filtered for Sales Staff
  let totalCustomers, customersWithDebt, totalDebtAmount;

  if (req.user.role !== 'admin') {
    // Get customers this salesperson has dealt with
    const customerIds = await Sale.distinct('customer', { salesPerson: req.user._id });
    
    totalCustomers = customerIds.length;
    
    // Get debt only from sales made by this salesperson
    const debtStats = await Sale.aggregate([
      { 
        $match: { 
          salesPerson: req.user._id, 
          paymentStatus: { $ne: 'paid' },
          status: { $ne: 'cancelled' }
        } 
      },
      {
        $group: {
          _id: '$customer',
          customerDebt: { $sum: '$amountDue' }
        }
      },
      { $match: { customerDebt: { $gt: 0 } } }
    ]);
    
    customersWithDebt = debtStats.length;
    totalDebtAmount = debtStats.reduce((sum, d) => sum + d.customerDebt, 0);
  } else {
    // Admin sees global stats
    totalCustomers = await Customer.countDocuments({ isActive: true });
    customersWithDebt = await Customer.countDocuments({
      isActive: true,
      currentCredit: { $gt: 0 }
    });
    
    const globalDebt = await Customer.aggregate([
      { $match: { isActive: true, currentCredit: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$currentCredit' } } }
    ]);
    totalDebtAmount = globalDebt[0]?.total || 0;
  }

  // Recent sales
  const recentSales = await Sale.find({ 
    status: { $ne: 'cancelled' },
    ...matchFilter
  })
    .populate('customer', 'name')
    .sort('-createdAt')
    .limit(5);

  // Low stock products list
  const lowStockList = await Product.find({
    isActive: true,
    $expr: { $lte: ['$quantity', '$minStockLevel'] }
  }).select('name quantity minStockLevel unit').limit(10);

  // Compute trend percentage (current month vs last month)
  const lastMonthRevenue = lastMonthlySales[0]?.revenue || 0;
  const thisMonthRevenue = monthlySales[0]?.revenue || 0;
  const revenueTrend = lastMonthRevenue === 0
    ? (thisMonthRevenue > 0 ? 100 : 0)
    : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);

  const lastMonthCount = lastMonthlySales[0]?.count || 0;
  const thisMonthCount = monthlySales[0]?.count || 0;
  const salesCountTrend = lastMonthCount === 0
    ? (thisMonthCount > 0 ? 100 : 0)
    : Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);

  res.json({
    success: true,
    data: {
      today: {
        sales: todaySales[0]?.count || 0,
        revenue: todaySales[0]?.revenue || 0,
        paid: todaySales[0]?.paid || 0
      },
      monthly: {
        sales: monthlySales[0]?.count || 0,
        revenue: monthlySales[0]?.revenue || 0,
        paid: monthlySales[0]?.paid || 0,
        revenueTrend,
        salesCountTrend,
        lastMonthRevenue,
        lastMonthCount
      },
      inventory: {
        totalProducts,
        lowStockCount: lowStockProducts,
        outOfStockCount: outOfStockProducts,
        totalCost: inventoryValue[0]?.totalCost || 0,
        totalValue: inventoryValue[0]?.totalValue || 0
      },
      customers: {
        total: totalCustomers,
        withDebt: customersWithDebt,
        totalDebt: totalDebtAmount
      },
      recentSales: recentSales.map(sale => ({
        id: sale._id,
        invoiceNumber: sale.invoiceNumber,
        customer: sale.customer?.name,
        total: sale.total,
        paymentStatus: sale.paymentStatus,
        date: sale.createdAt
      })),
      lowStockProducts: lowStockList
    }
  });
});

// @desc    Get sales chart data
// @route   GET /api/dashboard/sales-chart
// @access  Private
const getSalesChart = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  
  let groupBy, format, limit;
  
  // Define filter based on user role
  const matchFilter = {};
  if (req.user.role !== 'admin') {
    matchFilter.salesPerson = req.user._id;
  }
  
  if (period === 'week') {
    // Last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const sales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $ne: 'cancelled' },
          ...matchFilter
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const chartData = sales.map(s => ({
      label: `${s._id.day}/${s._id.month}`,
      revenue: s.revenue,
      sales: s.count
    }));

    return res.json({
      success: true,
      data: chartData
    });
  }
  
  if (period === 'month') {
    // Daily for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const sales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          status: { $ne: 'cancelled' },
          ...matchFilter
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$createdAt' },
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const daysInMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0).getDate();
    const chartData = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dayData = sales.find(s => s._id === i);
      chartData.push({
        label: `${i}`,
        revenue: dayData?.revenue || 0,
        sales: dayData?.count || 0
      });
    }

    return res.json({
      success: true,
      data: chartData
    });
  }
  
  if (period === 'year') {
    // Monthly for current year
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    
    const sales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear },
          status: { $ne: 'cancelled' },
          ...matchFilter
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = months.map((month, index) => {
      const monthData = sales.find(s => s._id === index + 1);
      return {
        label: month,
        revenue: monthData?.revenue || 0,
        sales: monthData?.count || 0
      };
    });

    return res.json({
      success: true,
      data: chartData
    });
  }

  res.json({
    success: true,
    data: []
  });
});

// @desc    Get top selling products
// @route   GET /api/dashboard/top-products
// @access  Private
const getTopProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const topProducts = await Sale.aggregate([
    { 
      $match: { 
        status: { $ne: 'cancelled' },
        ...(req.user.role !== 'admin' ? { salesPerson: req.user._id } : {})
      } 
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        _id: 1,
        name: '$product.name',
        category: '$product.category',
        totalQuantity: 1,
        totalRevenue: 1
      }
    }
  ]);

  res.json({
    success: true,
    data: topProducts
  });
});

module.exports = {
  getDashboardStats,
  getSalesChart,
  getTopProducts
};
