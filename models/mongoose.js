var log = require('../lib/debug')('mongoose');
var mongoose = require('mongoose');
var SessionStore = require('koa-generic-session-mongo');
var NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'development') {
  var url = 'mongodb://127.0.0.1:27017/zhiqian?auto_reconnect=true';
  mongoose.connect(url);
  mongoose.set('debug', log);
  mongoose.sessionStore = new SessionStore({
    url: url
  });
} else if (process.env.NODE_ENV === 'test') {
  var url = 'mongodb://127.0.0.1:27017/?auto_reconnect=true';
  mongoose.connect(url);
  mongoose.sessionStore = new SessionStore({
    url: url
  });
} else if (process.env.MONGO_URL) {
  var url = process.env.MONGO_URL;
  mongoose.connect(url);
  mongoose.sessionStore = new SessionStore({
    url: url
  });
}

module.exports = mongoose;
