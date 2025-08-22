const mongoose = require('mongoose');

const ticketPriceSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Le type de billet est requis'],
    enum: ['adult', 'child', 'student', 'group'],
    unique: true,
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif'],
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const TicketPrice = mongoose.model('TicketPrice', ticketPriceSchema);

module.exports = TicketPrice;