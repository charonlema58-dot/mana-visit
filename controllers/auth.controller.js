const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpire } = require('../config/auth');
const User = require('../models/User');
const asyncHandler = require('../middlewares/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Connecter un utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  // Vérifier que l'email et le mot de passe sont fournis
  if (!username || !password) {
    return next(new ErrorResponse('Veuillez fournir un nom d\'utilisateur et un mot de passe', 400));
  }

  // Vérifier l'utilisateur
  const user = await User.findOne({ username }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Identifiants invalides', 401));
  }

  // Vérifier le mot de passe
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Identifiants invalides', 401));
  }

  // Vérifier si le compte est actif
  if (!user.isActive) {
    return next(new ErrorResponse('Votre compte est désactivé. Contactez l\'administrateur.', 401));
  }

  // Créer le token JWT
  const token = jwt.sign({ id: user._id }, jwtSecret, {
    expiresIn: jwtExpire,
  });

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
});

// @desc    Obtenir l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});