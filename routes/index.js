import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const express = require('express');

const router = (app) => {
  const route = express.Router();
  app.use(express.json());
  app.use('/', route);
  route.get('/status', AppController.getStatus);
  route.get('/stats', AppController.getStats);
  route.post('/users', UsersController.postNew);
};

export default router;
