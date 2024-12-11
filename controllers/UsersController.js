import sha1 from 'sha1';
// import redisClient from '../utils/redis';
import dbClient from '../utils/db';

// const { ObjectId } = require('mongodb');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).send({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });

    const existingUser = await dbClient.db.collection('users').findOne({ email });
    if (existingUser) return res.status(400).send({ error: 'Already exist' });

    const hashedPassword = sha1(password);
    const result = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });

    return res.status(201).send({ id: result.insertedId, email });
  }
}

export default UsersController;
