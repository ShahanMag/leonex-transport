// Utility functions for common operations

// Format date to readable format
exports.formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Calculate days between two dates
exports.calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

// Calculate total amount based on rent price and days
exports.calculateRent = (rentPrice, days) => {
  return rentPrice * days;
};

// Validate email format
exports.isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
exports.isValidPhone = (phone) => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

// Generate unique ID
exports.generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Calculate average
exports.calculateAverage = (values) => {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return (sum / values.length).toFixed(2);
};

// Paginate results
exports.paginate = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: array.length,
      pages: Math.ceil(array.length / limit),
    },
  };
};
