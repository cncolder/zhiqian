var debug = require('debug');

if (location.hostname == 'localhost') {
  debug.enable("*");
}

module.exports = debug;
