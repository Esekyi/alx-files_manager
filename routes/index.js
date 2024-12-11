import AppController from '../controllers/AppController';

const express = require('express');

const router = (app) => {
  const route = express.Router();
  app.use(express.json());
  app.use('/', route);
  route.get('/status', AppController.getStatus);
  route.get('/stats', AppController.getStats);
};

export default router;
