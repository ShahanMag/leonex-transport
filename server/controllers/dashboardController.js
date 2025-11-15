const Payment = require('../models/Payment');

/**
 * Get Monthly Rental Analytics
 *
 * Returns monthly data with:
 * - revenue: Total received from companies (vehicle-acquisition payments - companies pay Leonix)
 * - cost: Total paid to drivers (driver-rental payments - Leonix pays drivers)
 * - profit: Difference between revenue and cost (revenue - cost)
 */
exports.getMonthlyRentalAnalytics = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Aggregate acquisition payments (Company → Leonix) - THIS IS REVENUE
    const acquisitionData = await Payment.aggregate([
      {
        $match: {
          payment_type: 'vehicle-acquisition',
          $expr: { $eq: [{ $year: '$acquisition_date' }, targetYear] }
        }
      },
      {
        $group: {
          _id: { $month: '$acquisition_date' },
          total_revenue: { $sum: '$total_amount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Aggregate rental payments (Leonix → Driver) - THIS IS COST
    const rentalData = await Payment.aggregate([
      {
        $match: {
          payment_type: 'driver-rental',
          $expr: { $eq: [{ $year: '$rental_date' }, targetYear] }
        }
      },
      {
        $group: {
          _id: { $month: '$rental_date' },
          total_cost: { $sum: '$total_amount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Create a map for easy lookup
    const revenueMap = {};
    acquisitionData.forEach(item => {
      revenueMap[item._id] = item.total_revenue;
    });

    const costMap = {};
    rentalData.forEach(item => {
      costMap[item._id] = item.total_cost;
    });

    // Month names
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Build the response with all 12 months
    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      const revenue = revenueMap[month] || 0;
      const cost = costMap[month] || 0;
      const profit = revenue - cost;

      monthlyData.push({
        month: monthNames[month - 1],
        monthNumber: month,
        revenue: revenue,
        cost: cost,
        profit: profit
      });
    }

    res.status(200).json({
      year: targetYear,
      data: monthlyData
    });

  } catch (error) {
    console.error('Error fetching monthly rental analytics:', error);
    res.status(500).json({
      message: 'Failed to fetch monthly rental analytics',
      error: error.message
    });
  }
};
