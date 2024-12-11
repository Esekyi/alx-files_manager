const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.client.on('error', (err) => {
      console.error(`Redis client not connected: ${err}`);
    });
  }

  isAlive() {
    return this.client.connected;
  }
}

const redisClient = new RedisClient();
export default redisClient;
