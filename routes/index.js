import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';

const express = require('express');

const router = (app) => {
  const route = express.Router();
  app.use(express.json());
  app.use('/', route);
  route.get('/status', AppController.getStatus);
  route.get('/stats', AppController.getStats);
  route.post('/users', UsersController.postNew);
  route.get('/connect', AuthController.getConnect);
  route.get('/disconnect', AuthController.getDisconnect);
  route.get('/users/me', UsersController.getMe);
};

export default router;
