var debug = require('debug');

debug.log = console.log.bind(console);

module.exports = function(namespace) {
  var log = debug(namespace);

  log.log = console.log.bind(console);

  return log;
};
