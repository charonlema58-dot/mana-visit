const Visitor = require('../models/Visitor');
const asyncHandler = require('../middlewares/async');
const ErrorResponse = require('../utils/errorResponse');
const moment = require('moment');
const { generatePDFReport } = require('../services/pdf.service');
const { sendEmailWithAttachment } = require('../services/email.service');

// @desc    Générer un rapport
// @route   POST /api/reports/generate
// @access  Private
exports.generateReport = asyncHandler(async (req, res, next) => {
  const { reportType, startDate, endDate, email } = req.body;

  let dateRange = {};
  let reportTitle = '';

  // Déterminer la période en fonction du type de rapport
  switch (reportType) {
    case 'daily':
      dateRange = {
        start: moment().startOf('day').toDate(),
        end: moment().endOf('day').toDate(),
      };
      reportTitle = `Rapport Quotidien - ${moment().format('DD/MM/YYYY')}`;
      break;
    case 'weekly':
      dateRange = {
        start: moment().startOf('week').toDate(),
        end: moment().endOf('week').toDate(),
      };
      reportTitle = `Rapport Hebdomadaire - Semaine ${moment().week()} (${moment(dateRange.start).format('DD/MM')} - ${moment(dateRange.end).format('DD/MM/YYYY')})`;
      break;
    case 'monthly':
      dateRange = {
        start: moment().startOf('month').toDate(),
        end: moment().endOf('month').toDate(),
      };
      reportTitle = `Rapport Mensuel - ${moment().format('MMMM YYYY')}`;
      break;
    case 'yearly':
      dateRange = {
        start: moment().startOf('year').toDate(),
        end: moment().endOf('year').toDate(),
      };
      reportTitle = `Rapport Annuel - ${moment().format('YYYY')}`;
      break;
    case 'custom':
      if (!startDate || !endDate) {
        return next(new ErrorResponse('Veuillez spécifier une période personnalisée', 400));
      }
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
      reportTitle = `Rapport Personnalisé (${moment(dateRange.start).format('DD/MM/YYYY')} - ${moment(dateRange.end).format('DD/MM/YYYY')})`;
      break;
    default:
      return next(new ErrorResponse('Type de rapport non valide', 400));
  }

  // Obtenir les statistiques globales
  const stats = await Visitor.aggregate([
    {
      $match: {
        visitDate: {
          $gte: dateRange.start,
          $lte: dateRange.end,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalVisitors: { $sum: 1 },
        totalRevenue: { $sum: '$ticketPrice' },
        byType: { $push: { type: '$type', price: '$ticketPrice' } },
      },
    },
    {
      $unwind: '$byType',
    },
    {
      $group: {
        _id: '$byType.type',
        totalVisitors: { $sum: 1 },
        totalRevenue: { $sum: '$byType.price' },
        allRevenue: { $first: '$totalRevenue' },
        allVisitors: { $first: '$totalVisitors' },
      },
    },
    {
      $project: {
        type: '$_id',
        totalVisitors: 1,
        totalRevenue: 1,
        percentage: {
          $round: [
            {
              $multiply: [
                { $divide: ['$totalVisitors', '$allVisitors'] },
                100,
              ],
            },
            2,
          ],
        },
        allRevenue: 1,
        allVisitors: 1,
        _id: 0,
      },
    },
  ]);

  // Obtenir les visiteurs détaillés
  const visitors = await Visitor.find({
    visitDate: {
      $gte: dateRange.start,
      $lte: dateRange.end,
    },
  }).sort({ visitDate: 1 });

  // Préparer les données du rapport
  const reportData = {
    title: reportTitle,
    period: {
      start: dateRange.start,
      end: dateRange.end,
    },
    stats,
    visitors,
    generatedAt: new Date(),
    generatedBy: req.user.username,
  };

  // Si un email est fourni, envoyer le rapport par email
  if (email) {
    try {
      const pdfBuffer = await generatePDFReport(reportData);
      await sendEmailWithAttachment(
        email,
        `ManaVisit - ${reportTitle}`,
        'Veuillez trouver ci-joint le rapport demandé.',
        pdfBuffer,
        `ManaVisit_${moment().format('YYYYMMDD_HHmmss')}.pdf`
      );
      
      return res.status(200).json({
        success: true,
        message: `Rapport envoyé avec succès à ${email}`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rapport:', error);
      return next(new ErrorResponse('Erreur lors de l\'envoi du rapport par email', 500));
    }
  }

  res.status(200).json({
    success: true,
    data: reportData,
  });
});

// @desc    Exporter un rapport en PDF
// @route   POST /api/reports/export
// @access  Private
exports.exportReport = asyncHandler(async (req, res, next) => {
  const { reportData } = req.body;

  if (!reportData) {
    return next(new ErrorResponse('Données du rapport requises', 400));
  }

  try {
    const pdfBuffer = await generatePDFReport(reportData);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=ManaVisit_${moment().format('YYYYMMDD_HHmmss')}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return next(new ErrorResponse('Erreur lors de la génération du PDF', 500));
  }
});