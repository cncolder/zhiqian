var child = require('child_process');
var gulp = require('gulp');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var less = require('gulp-less');
var prefix = require('gulp-autoprefixer');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', ['pm2:start', 'pm2:logs', 'watch']);

gulp.task('watch', function() {
  gulp.watch('views/less/**/*.less', ['less']);
  gulp.watch('views/js/**/*.js', ['browserify']);
  gulp.watch(
    ['index.js', 'app.js', 'lib/*.js', 'models/**/*.js', 'routes/**/*.js'], ['pm2:reload']
  );
  gulp.watch(['test/**/*.js', '!test/browser/*'], ['mocha']);
});

gulp.task('less', function() {
  return gulp.src('./views/less/index.less')
    .pipe(less().on('error', function(err) {
      gutil.log(err.message);
      this.emit('end');
    }))
    .pipe(prefix())
    .pipe(concat('all.css'))
    .pipe(gulp.dest('./public/css'))
    .on('end', function() {
      // del(['./public/css/all.css.gz']);
    });
});

gulp.task('browserify', function() {
  // set up the browserify instance on a task basis
  var b = browserify({
    debug: true
  });
  // transform regular node stream to gulp (buffered vinyl) stream
  var browserified = transform(function(filename) {
    b.add(filename);
    return b.bundle();
  });

  return gulp.src('./views/js/index.js')
    .pipe(browserified)
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
  // .pipe(uglify())
  .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js/'));
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

gulp.task('pm2:stop', function(cb) {
  child.spawn('pm2', ['stop', 'package.json'], {
    stdio: 'inherit'
  })
    .on('exit', cb);
});

gulp.task('pm2:logs', function(cb) {
  child.spawn('pm2', ['logs', 'zhiqian'], {
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

// process.on('beforeExit', function() {
//   console.log('gulp exit');
//   child.spawn('pm2', ['stop', 'all'], {
//     stdio: 'inherit'
//   });
// });

process.on('SIGINT', function() {
  child.spawn('pm2', ['stop', 'package.json'], {
    stdio: 'inherit'
  })
    .on('exit', function() {
      process.exit(0);
    });
});
