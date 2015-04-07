var log = require('../lib/debug')('mongoose');
var mongoose = require('mongoose');
var NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'development') {
  mongoose.connect('mongodb://127.0.0.1:27017/zhiqian?auto_reconnect=true');
  mongoose.set('debug', log);
} else if (process.env.NODE_ENV === 'test') {
  mongoose.connect('mongodb://127.0.0.1:27017/?auto_reconnect=true');
} else if (process.env.MONGO_URL) {
  mongoose.connect(process.env.MONGO_URL);
}

module.exports = mongoose;
