var child = require('child_process');
var gulp = require('gulp');

gulp.task('default', ['pm2:start', 'pm2:logs', 'watch']);

gulp.task('watch', function() {
  gulp.watch(['index.js', 'app.js', 'lib/*.js', 'models/**/*.js', 'routes/**/*.js'], ['pm2:reload']);
  gulp.watch(['test/**/*.js', '!test/browser/*'], ['mocha']);
});

gulp.task('pm2:start', function(cb) {
  child.spawn('pm2', ['startOrRestart', 'package.json'], {
    stdio: 'inherit'
  })
    .on('exit', cb);
});

gulp.task('pm2:reload', function(cb) {
  child.spawn('pm2', ['startOrReload', 'package.json'], {
    stdio: 'inherit'
  })
    .on('exit', cb);
});

gulp.task('pm2:logs', function(cb) {
  child.spawn('pm2', ['logs', 'wish.pe'], {
    stdio: 'inherit'
  })
    .on('exit', cb);
});

gulp.task('mocha', function(done) {
  var env = Object.keys(process.env).reduce(function(env, key) {
    env[key] = process.env[key];
    return env;
  }, {});
  env.NODE_ENV = 'test';
  env.DEBUG = 'wishing:*';
  env.MONGOOSE_DISABLE_STABILITY_WARNING = 1;

  child.spawn('mocha', ['--harmony', '--bail', '--reporter', 'dot'], {
    env: env,
    stdio: 'inherit'
  }).on('close', done);
});

process.on('exit', function() {
  child.spawnSync('pm2', ['kill'], {
    stdio: 'inherit'
  });
});
