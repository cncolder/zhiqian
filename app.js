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
    this.state = {
      title: '好多童书 - 知谦文化传播'
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
  .get('/poll/outlets', function * () {
    yield this.render('poll/outlets', {
      partials: {
        head: '../head',
        nav: '../nav',
        footer: '../footer',
        script: '../script'
      }
    });
  });

module.exports = app;
