// import { Redis } from "ioredis";

// export const redisConnection = new Redis({
//   host: "127.0.0.1",
//   port: 6379,
//   maxRetriesPerRequest: null, // <--- THIS IS REQUIRED
// });
// redisConnection.ping().then(console.log).catch(console.error);

import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();
export const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisConnection
  .ping()
  .then((log) => console.log("Connected to Upstash Redis!", log))
  .catch(console.error);
