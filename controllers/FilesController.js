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
      .findOne({ _id: ObjectId(redisToken) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const name = req.body;
    if (!name) return res.status(400).send({ error: 'Missing name' });

    const fileType = req.body.type;
    if (!fileType || !['folder', 'file', 'image'].includes(fileType)) res.status(400).send({ error: 'Missing type' });

    const fileData = req.body.data;
    if (!fileData && ['file', 'image'].includes(fileType)) return res.status(400).send({ error: 'Missing data' });

    const fileIsPublic = req.body.isPublic || false;
    let parentId = req.body || 0;
    parentId = parentId === '0' ? 0 : parentId;
    if (parentId !== 0) {
      const parentFile = await dbClient.db
        .collection('files')
        .findOne({ _id: ObjectId(parentId) });
      if (!parentFile) return res.status(400).send({ error: 'Parent not found' });
      if (!['folder'].includes(parentFile.type)) return res.status(400).send({ error: 'Parent is not a folder' });
    }

    const dbFile = {
      userId: user._id,
      name,
      type: fileType,
      isPublic: fileIsPublic,
      parentId,
    };

    if (['folder'].includes(fileType)) {
      await dbClient.db.collection('files').insertOne(dbFile);
      return res.status(201).send({
        id: dbFile._id,
        userId: dbFile.userId,
        name: dbFile.name,
        type: dbFile.type,
        isPublic: dbFile.isPublic,
        parentId: dbFile.parentId,
      });
    }
    const pathDir = process.env.FOLDER_PATH || '/tmp/files_manager';
    const renameFile = uuidv4();

    const buffer = Buffer.from(fileData, 'base64');
    const path = `${pathDir}/${renameFile}`;

    await fs.mkdir(pathDir, { recursive: true }, (err) => {
      if (err) return res.status(400).send({ error: err.message });
      return true;
    });

    await fs.writeFile(path, buffer, (err) => {
      if (err) return res.status(400).send({ error: err.message });
      return true;
    });

    dbFile.localPath = path;
    await dbClient.db.collection('files').insertOne(dbFile);

    fileQueue.add({
      userId: user._id,
      fileId: dbFile._id,
    });

    return res.status(201).send({
      id: dbFile._id,
      userId: dbFile.userId,
      name: dbFile.name,
      type: dbFile.type,
      isPublic: dbFile.isPublic,
      parentId: dbFile.parentId,
    });
  }
}

export default FilesController;
