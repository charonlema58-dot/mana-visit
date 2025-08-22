const Visitor = require('../models/Visitor');
const TicketPrice = require('../models/TicketPrice');
const asyncHandler = require('../middlewares/async');
const ErrorResponse = require('../utils/errorResponse');
const moment = require('moment');

// @desc    Récupérer tous les visiteurs
// @route   GET /api/visitors
// @access  Private
exports.getVisitors = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, search, type, fromDate, toDate } = req.query;

  const query = {};

  // Filtre de recherche
  if (search) {
    query.$text = { $search: search };
  }

  // Filtre par type
  if (type) {
    query.type = type;
  }

  // Filtre par date
  if (fromDate || toDate) {
    query.visitDate = {};
    if (fromDate) query.visitDate.$gte = new Date(fromDate);
    if (toDate) query.visitDate.$lte = new Date(toDate);
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { visitDate: -1 },
    populate: 'createdBy',
  };

  const visitors = await Visitor.paginate(query, options);

  res.status(200).json({
    success: true,
    data: visitors,
  });
});

// @desc    Récupérer un visiteur
// @route   GET /api/visitors/:id
// @access  Private
exports.getVisitor = asyncHandler(async (req, res, next) => {
  const visitor = await Visitor.findById(req.params.id).populate('createdBy');

  if (!visitor) {
    return next(new ErrorResponse(`Visiteur non trouvé avec l'ID ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: visitor,
  });
});

// @desc    Créer un visiteur
// @route   POST /api/visitors
// @access  Private
exports.createVisitor = asyncHandler(async (req, res, next) => {
  // Récupérer le prix du billet en fonction du type
  const ticketPrice = await TicketPrice.findOne({ type: req.body.type });
  
  if (!ticketPrice) {
    return next(new ErrorResponse(`Type de billet ${req.body.type} non trouvé`, 404));
  }

  // Calculer le prix total (pour les groupes)
  const price = req.body.type === 'group' 
    ? ticketPrice.price * (req.body.groupSize || 1)
    : ticketPrice.price;

  const visitorData = {
    ...req.body,
    ticketPrice: price,
    createdBy: req.user.id,
    arrivalTime: moment().format('HH:mm'),
  };

  const visitor = await Visitor.create(visitorData);

  res.status(201).json({
    success: true,
    data: visitor,
  });
});

// @desc    Mettre à jour un visiteur
// @route   PUT /api/visitors/:id
// @access  Private
exports.updateVisitor = asyncHandler(async (req, res, next) => {
  let visitor = await Visitor.findById(req.params.id);

  if (!visitor) {
    return next(new ErrorResponse(`Visiteur non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // Vérifier si le type a changé
  if (req.body.type && req.body.type !== visitor.type) {
    const ticketPrice = await TicketPrice.findOne({ type: req.body.type });
    
    if (!ticketPrice) {
      return next(new ErrorResponse(`Type de billet ${req.body.type} non trouvé`, 404));
    }

    // Recalculer le prix si le type a changé
    req.body.ticketPrice = req.body.type === 'group' 
      ? ticketPrice.price * (req.body.groupSize || visitor.groupSize || 1)
      : ticketPrice.price;
  } else if (req.body.groupSize && visitor.type === 'group') {
    // Recalculer le prix si la taille du groupe a changé
    const ticketPrice = await TicketPrice.findOne({ type: 'group' });
    req.body.ticketPrice = ticketPrice.price * req.body.groupSize;
  }

  visitor = await Visitor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: visitor,
  });
});

// @desc    Supprimer un visiteur
// @route   DELETE /api/visitors/:id
// @access  Private (Admin)
exports.deleteVisitor = asyncHandler(async (req, res, next) => {
  const visitor = await Visitor.findById(req.params.id);

  if (!visitor) {
    return next(new ErrorResponse(`Visiteur non trouvé avec l'ID ${req.params.id}`, 404));
  }

  await visitor.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Obtenir les statistiques des visiteurs
// @route   GET /api/visitors/stats/dashboard
// @access  Private
exports.getVisitorStats = asyncHandler(async (req, res, next) => {
  const today = moment().startOf('day');
  const monthStart = moment().startOf('month');
  const yearStart = moment().startOf('year');

  // Visiteurs aujourd'hui
  const todayVisitors = await Visitor.countDocuments({
    visitDate: {
      $gte: today.toDate(),
      $lte: moment().endOf('day').toDate(),
    },
  });

  // Recettes aujourd'hui
  const todayRevenue = await Visitor.aggregate([
    {
      $match: {
        visitDate: {
          $gte: today.toDate(),
          $lte: moment().endOf('day').toDate(),
        },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$ticketPrice' },
      },
    },
  ]);

  // Visiteurs ce mois-ci
  const monthVisitors = await Visitor.countDocuments({
    visitDate: {
      $gte: monthStart.toDate(),
      $lte: moment().endOf('month').toDate(),
    },
  });

  // Visiteurs récents (5 derniers)
  const recentVisitors = await Visitor.find()
    .sort({ visitDate: -1, createdAt: -1 })
    .limit(5)
    .populate('createdBy');

  res.status(200).json({
    success: true,
    data: {
      todayVisitors,
      todayRevenue: todayRevenue.length ? todayRevenue[0].total : 0,
      monthVisitors,
      recentVisitors,
    },
  });
});