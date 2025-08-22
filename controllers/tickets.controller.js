const TicketPrice = require('../models/TicketPrice');
const asyncHandler = require('../middlewares/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Récupérer tous les prix des billets
// @route   GET /api/tickets/prices
// @access  Private
exports.getTicketPrices = asyncHandler(async (req, res, next) => {
  const ticketPrices = await TicketPrice.find().populate('updatedBy');

  res.status(200).json({
    success: true,
    data: ticketPrices,
  });
});

// @desc    Mettre à jour le prix d'un billet
// @route   PUT /api/tickets/prices/:type
// @access  Private (Admin)
exports.updateTicketPrice = asyncHandler(async (req, res, next) => {
  const { type } = req.params;
  const { price } = req.body;

  const ticketPrice = await TicketPrice.findOneAndUpdate(
    { type },
    { 
      price,
      updatedBy: req.user.id,
      lastUpdated: Date.now(),
    },
    { new: true, runValidators: true }
  ).populate('updatedBy');

  if (!ticketPrice) {
    return next(new ErrorResponse(`Type de billet ${type} non trouvé`, 404));
  }

  res.status(200).json({
    success: true,
    data: ticketPrice,
  });
});

// @desc    Obtenir les statistiques de vente des billets
// @route   GET /api/tickets/stats
// @access  Private
exports.getTicketStats = asyncHandler(async (req, res, next) => {
  const { fromDate, toDate } = req.query;

  const match = {};
  
  if (fromDate || toDate) {
    match.visitDate = {};
    if (fromDate) match.visitDate.$gte = new Date(fromDate);
    if (toDate) match.visitDate.$lte = new Date(toDate);
  }

  const stats = await Visitor.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$ticketPrice' },
      },
    },
    {
      $project: {
        type: '$_id',
        count: 1,
        totalRevenue: 1,
        _id: 0,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: stats,
  });
});