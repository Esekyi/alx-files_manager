import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const ObjectId = require('mongodb');
const fs = require('fs');
const Bull = require('bull');

class FilesController {
  static async postUpload(req, res) {
    const fileQueue = new Bull('fileQueue');

    const token = req.header('X-Token') || null;
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    const redisToken = await redisClient.get(`auth_${token}`);
    if (!redisToken) return res.status(401).send({ error: 'Unauthorized' });

    const user = await dbClient.db
      .collection('users')
      .findOne({ _id: new ObjectId(redisToken) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const {
      name,
      type,
      parentId = 0,
      isPublic = false,
      data,
    } = req.body;

    if (!name) return res.status(400).send({ error: 'Missing name' });

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      res.status(400).send({ error: 'Missing type' });
    }

    if (!data && ['file', 'image'].includes(type)) {
      return res.status(400).send({ error: 'Missing data' });
    }

    let parentFile = null;
    if (parentId !== 0) {
      parentFile = await dbClient.db
        .collection('files')
        .findOne({ _id: new ObjectId(parentId) });

      if (!parentFile) return res.status(400).send({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).send({ error: 'Parent is not a folder' });
    }

    const dbFile = {
      userId: user._id,
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : new ObjectId(parentId),
    };

    if (type === 'folder') {
      const result = await dbClient.db.collection('files').insertOne(dbFile);
      return res.status(201).send({
        id: result.insertedId,
        userId: dbFile.userId,
        name: dbFile.name,
        type: dbFile.type,
        isPublic: dbFile.isPublic,
        parentId: dbFile.parentId,
      });
    }
    const pathDir = process.env.FOLDER_PATH || '/tmp/files_manager';
    const renameFile = uuidv4();
    const filePath = `${pathDir}/${renameFile}`;

    await fs.mkdir(pathDir, { recursive: true });

    const buffer = Buffer.from(data, 'base64');

    await fs.writeFile(filePath, buffer);

    dbFile.localPath = filePath;
    const result = await dbClient.db.collection('files').insertOne(dbFile);

    fileQueue.add({
      userId: user._id,
      fileId: result.insertedId,
    });

    return res.status(201).send({
      id: result.insertedId,
      userId: dbFile.userId,
      name: dbFile.name,
      type: dbFile.type,
      isPublic: dbFile.isPublic,
      parentId: dbFile.parentId,
    });
  }
}

export default FilesController;
