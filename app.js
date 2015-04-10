// require

var log = require('./lib/debug')('app');
var ms = require('ms');

// app

var koa = require('koa');
var app = koa();
app.proxy = true;

// config

var options = {
  compress: {
    // filter: function(content_type) {
    //   return /text/i.test(content_type)
    // },
    // threshold: 2048,
    // flush: require('zlib').Z_SYNC_FLUSH
  },

  fileServer: {
    root: './public',
    maxage: ms('30 days')
    // index: 'index.html',
    // hidden: false
  },

  polyfills: {
    path: '/js/polyfill.js'
  },

  views: {
    path: './views',
    default: 'html',
    map: {
      html: 'hogan'
    }
  }
};

if (app.env == 'development') {
  options.fileServer.maxage = 0;
}

var cache = {};

// response time

app.use(require('koa-response-time')());

// logger

if (app.env == 'development') {
  app.use(require('koa-logger')(options.logger));
}

// compress

app.use(require('koa-compress')(options.compress));

// file server

app.use(require('koa-static')(options.fileServer.root, options.fileServer));

// polyfills

app.use(require('koa-polyfills')(options.polyfills));

// view renderer

app.use(require('koa-views')(options.views.path, options.views));

// body

var body = require('koa-body-parsers');
body(app);

// json

var json = require('koa-json');
app.use(json());

// router

var router = require('koa-router');
var Vote = require('./models/vote');
var WechatOAuth = require('wechat-oauth');
var wechatApi = new WechatOAuth('wxfe7869827f87e1f8', '46ab238379501c7df5eff0318b9162b8');
var wechatAuthorizeUrl = wechatApi.getAuthorizeURL(
  'http://haoduo.vitarn.com/wx/authorize', 'haoduotongshu', 'snsapi_base'
);
log(wechatAuthorizeUrl);

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
        content: 'company'
      }
    });
  })
  .get('/business', function * () {
    yield this.render('layout', {
      partials: {
        content: 'business'
      }
    });
  })
  .get('/product', function * () {
    yield this.render('layout', {
      partials: {
        content: 'product'
      }
    });
  })
  .get('/team', function * () {
    yield this.render('layout', {
      partials: {
        content: 'team'
      }
    });
  })
  .get('/poll/outlets', function * () {
    var ip = this.ip;

    if (!cache.outlets) {
      var path = require('path');
      var fs = require('mz/fs');
      var imgs = yield fs.readdir('./public/img/poll/outlets/200');

      cache.outlets = imgs.filter(function(img) {
        return path.extname(img) == '.jpg';
      }).map(function(img) {
        var arr = path.basename(img, '.jpg').split(/\s+/);
        return {
          code: arr[0],
          name: arr[1]
        };
      });
    }

    // log(cache.outlets.map(function (o) {
    //   return o.name;
    // }));

    var myvote = yield Vote.findOne({
      ip: ip
    });
    if (myvote) {
      myvote = myvote.toJSON();
      myvote.name = cache.outlets.find(function(item) {
        return item.code == myvote.code;
      }).name;
    }

    var votes = yield Vote.aggregate()
      .match({
        category: 'outlets'
      })
      .group({
        _id: '$code',
        count: {
          $sum: 1
        }
      }).exec();

    votes.forEach(function(vote) {
      cache.outlets.find(function(option) {
        return option.code == vote._id;
      }).vote = vote.count;
    });

    this.state = {
      myvote: myvote,
      options: cache.outlets.sort(function(a, b) {
        return (b.vote || 0) - (a.vote || 0);
      })
    };

    yield this.render('layout', {
      partials: {
        content: 'poll/outlets'
      }
    });
  })
  .post('/poll/outlets', function * () {
    var ip = this.ip;
    var vote = yield Vote.findOne({
      ip: ip
    });

    this.assert(!vote, 409, JSON.stringify(vote));

    var body = yield this.request.urlencoded();
    vote = yield Vote.create({
      category: 'outlets',
      code: body.code,
      ip: ip
    });
    this.body = vote;
  })
  .get('/wx/authorize', function * () {
    var code = this.query.code;
    log(code);

    wechatApi.getAccessToken(code, function(err, result) {
      var accessToken = result.data.access_token;
      var openid = result.data.openid;

      this.body = [code, access_token, openip].join('\n');
    });
  });

module.exports = app;
