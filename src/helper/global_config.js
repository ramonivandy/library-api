require('dotenv').config();
const confidence = require('confidence');

const config = {
  port: process.env.PORT || 3001,
  pgSql: {
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
  }
};

const store = new confidence.Store(config);
exports.get = key => store.get(key);
