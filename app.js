var koa = require('koa');
var app = koa();

// static file

var stat = require('koa-static');
app.use(stat('public', {
  maxage: 0
}));

// view renderer

var views = require('koa-views');
app.use(views('./views', {
  default: 'html',
  map: {
    html: 'mustache'
  }
}));

// logger

app.use(function * (next) {
  var start = new Date();
  yield next;
  var ms = new Date() - start;
  console.log('%s %s - %s', this.method, this.url, ms);
});

// json

var json = require('koa-json');
app.use(json());

// router

var router = require('koa-router');

app
  .use(router(app))
  .get('/', function * () {
    this.locals = {
      title: '知谦'
    };

    yield this.render('index', {
      partials: {
        head: 'head',
        nav: 'nav',
        footer: 'footer',
        script: 'script'
      }
    });
  })
  .get('/index.js', function * () {
    this.type = 'js';
    this.body = yield require('mz/fs').readFile('./views/index.js');
  })
  .get('/poll', function * () {
    yield this.render('poll', {
      partials: {
        head: 'head',
        nav: 'nav',
        footer: 'footer',
        script: 'script'
      }
    });
  });

module.exports = app;
