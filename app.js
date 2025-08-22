const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('./middlewares/error');
const connectDB = require('./config/db');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Charger les variables d'environnement
require('dotenv').config();

// Connexion à la base de données
connectDB();

// Création de l'application Express
const app = express();

// Middlewares
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cors());

// Configuration Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ManaVisit API',
      version: '1.0.0',
      description: 'API pour la gestion des visiteurs du Jardin Zoologique de Kinshasa',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/visitors', require('./routes/visitors.routes'));
app.use('/api/tickets', require('./routes/tickets.routes'));
app.use('/api/reports', require('./routes/reports.routes'));

// Gestionnaire d'erreurs
app.use(errorHandler);

module.exports = app;