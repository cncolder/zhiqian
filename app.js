var log = require('./lib/debug')('app');
var koa = require('koa');
var app = koa();

// static file

var stat = require('koa-static');
app.use(stat('public', {
  maxage: 0
}));

// polyfills

var polyfills = require('koa-polyfills');
app.use(polyfills({
  path: '/js/polyfill.js'
}));

// view renderer

var views = require('koa-views');
app.use(views('./views', {
  default: 'html',
  map: {
    html: 'hogan'
  }
}));

// logger

app.use(function * (next) {
  var start = new Date();
  yield next;
  var ms = new Date() - start;
  log('%s %s - %s', this.method, this.url, ms);
});

// json

var json = require('koa-json');
app.use(json());

// router

var router = require('koa-router');
var Vote = require('./models/vote');

app
  .use(router(app))
  .get('/', function * () {
    this.state = {
      title: '好多童书 - 知谦文化传播'
    };

    yield this.render('layout', {
      partials: {
        content: 'index'
      }
    });
  })
  .get('/company', function * () {
    yield this.render('layout', {
      partials: {
        company: 'company'
      }
    });
  })
  .get('/poll/outlets', function * () {
    log('env:', process.env);
    var ip = this.ip;

    this.state = {
      myvote: yield Vote.findOne({
        ip: ip
      }),
      options: require('./data/poll/outlets').map(function(item) {
        item.vote = Math.floor(1 + (Math.random() * 100));
        return item;
      }).sort(function(a, b) {
        return b.vote - a.vote;
      }).map(function(item, index) {
        if (index < 50) item.index = index + 1;
        return item;
      })
    };

    yield this.render('layout', {
      partials: {
        content: 'poll/outlets'
      }
    });
  })
  .post('/poll/outlets.json', function * () {
    log(this.ip);
  });

module.exports = app;
