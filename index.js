var log = require('./lib/debug')('index');
var app = require('./app');

if (module.parent) {
  module.exports = app;
} else {
  var http = require('http');
  var host = '0.0.0.0';
  var port = parseInt(process.env.PORT || 3000, 10);
  var server = http.createServer(app.callback());

  server.listen(port, host, function() {
    var address = server.address();
    log('App listening at http://%s:%s', address.address, address.port);
  });
}
