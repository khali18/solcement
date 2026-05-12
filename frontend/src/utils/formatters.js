export const formatCurrency = (amount, currency = 'GHS') => {
  if (amount === null || amount === undefined) return '-';
  
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return '-';
  
  return new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

export const formatDate = (date, options = {}) => {
  if (!date) return '-';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-GH', defaultOptions).format(d);
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  return new Intl.DateTimeFormat('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
};

export const formatPhone = (phone) => {
  if (!phone) return '-';
  
  // Ghana phone formatting
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

export const getCategoryLabel = (category) => {
  const categories = {
    cement: 'Cement',
    iron_rods: 'Iron Rods',
    zinc: 'Zinc/Roofing',
    paint: 'Paint',
    tiles: 'Tiles',
    sand: 'Sand',
    gravel: 'Gravel',
    bricks: 'Bricks',
    wood: 'Wood/Timber',
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    tools: 'Tools',
    other: 'Other'
  };
  return categories[category] || category;
};

export const getUnitLabel = (unit) => {
  const units = {
    bag: 'Bag',
    piece: 'Piece',
    kg: 'Kg',
    meter: 'Meter',
    liter: 'Liter',
    square_meter: 'm²',
    cubic_meter: 'm³',
    roll: 'Roll',
    set: 'Set',
    box: 'Box'
  };
  return units[unit] || unit;
};

export const getPaymentMethodLabel = (method) => {
  const methods = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    mobile_money: 'Mobile Money',
    credit: 'Credit',
    mixed: 'Mixed'
  };
  return methods[method] || method;
};

export const getPaymentStatusColor = (status) => {
  const colors = {
    paid: 'green',
    partial: 'yellow',
    unpaid: 'red'
  };
  return colors[status] || 'gray';
};

export const getStockStatusColor = (status) => {
  const colors = {
    in_stock: 'green',
    low_stock: 'yellow',
    out_of_stock: 'red'
  };
  return colors[status] || 'gray';
};
