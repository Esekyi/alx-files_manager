const { MongoClient } = require('mongodb');

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const uri = `mongodb://${host}:${port}`;

class DBClient {
  constructor() {
    MongoClient.connect(uri, (err, client) => {
      if (!err) {
        this.db = client.db(database);
      } else {
        this.db = null;
      }
    });
  }

  isAlive() {
    if (this.db) return true;
    return false;
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
