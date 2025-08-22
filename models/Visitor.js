const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const visitorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Le nom complet est requis'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Le type de visiteur est requis'],
    enum: ['adult', 'child', 'student', 'group'],
  },
  nationality: {
    type: String,
    required: [true, 'La nationalité est requise'],
    trim: true,
  },
  visitDate: {
    type: Date,
    required: [true, 'La date de visite est requise'],
    default: Date.now,
  },
  arrivalTime: {
    type: String,
    required: [true, "L'heure d'arrivée est requise"],
  },
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  comments: {
    type: String,
    trim: true,
  },
  ticketPrice: {
    type: Number,
    required: [true, 'Le prix du billet est requis'],
    min: [0, 'Le prix ne peut pas être négatif'],
  },
  groupSize: {
    type: Number,
    min: [1, 'La taille du groupe doit être au moins 1'],
    validate: {
      validator: function(v) {
        return this.type !== 'group' || v > 1;
      },
      message: 'La taille du groupe doit être spécifiée pour les groupes',
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Index pour les recherches fréquentes
visitorSchema.index({ fullName: 'text', phone: 'text', email: 'text' });
visitorSchema.plugin(mongoosePaginate);

const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;