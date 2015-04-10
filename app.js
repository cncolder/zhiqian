// require

var log = require('./lib/debug')('app');
var ms = require('ms');

// app

var koa = require('koa');
var app = koa();
app.proxy = true;
app.keys = ['haoduo tongshu zhiqian'];

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

  session: {

  },

  views: {
    path: './views',
    default: 'html',
    map: {
      html: 'hogan'
    }
  },

  wechat: {
    id: 'wxfe7869827f87e1f8',
    secret: '46ab238379501c7df5eff0318b9162b8'
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

// session

app.use(require('koa-session')(app, options.session));

// view renderer

app.use(require('koa-views')(options.views.path, options.views));

// body

require('koa-body-parsers')(app);

// json

app.use(require('koa-json')());

// router

var router = require('koa-router');
var Vote = require('./models/vote');
var WechatOAuth = require('wechat-oauth');
var wechatOAuth = new WechatOAuth(options.wechat.id, options.wechat.secret);
var WechatAPI = require('wechat-api');
var wechatApi = new WechatAPI(options.wechat.id, options.wechat.secret);

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
    'Mozilla/5.0 (iPhone; CPU iPhone OS 8_1_2 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Mobile/12B440 MicroMessenger/6.1.4 NetType/WIFI'; // jshint ignore:line
    if (/micromessenger/i.test(this.get('user-agent')) && !this.session.wx) {
      var url = wechatOAuth.getAuthorizeURL(
        'http://haoduo.vitarn.com/wx/authorize', '/poll/outlets', 'snsapi_base'
      );

      return this.redirect(url);
    }

    var wxid = this.session.wx.openid;

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

    var myvote = yield Vote.findOne({
      wxid: wxid
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
    var wxid = this.session.wx.openid;
    var ip = this.ip;
    var vote = yield Vote.findOne({
      wxid: wxid
    });

    this.assert(!vote, 409, JSON.stringify(vote));

    var body = yield this.request.urlencoded();
    vote = yield Vote.create({
      category: 'outlets',
      code: body.code,
      wxid: wxid,
      ip: ip
    });
    this.body = vote;
  })
  .get('/wechat', function * () {
    if (/micromessenger/i.test(this.get('user-agent'))) {
      yield this.render('wechat.m.html');
    } else {
      yield this.render('layout', {
        partials: {
          content: 'wechat'
        }
      });
    }
  })
  .get('/wx/authorize', function * () {
    var code = this.query.code;
    var result = yield new Promise(function(resolve, reject) {
      wechatOAuth.getAccessToken(code, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
    var openid = result.data.openid;

    var userinfo = yield new Promise(function(resolve, reject) {
      wechatApi.getUser(openid, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    this.session.wx = {
      openid: openid,
      userinfo: userinfo
    };

    if (userinfo.subscribe) {
      this.redirect(this.query.state);
    } else {
      this.redirect('/wechat');
    }
  })
  .get('/wx/token', function * () {
    this.body = this.query.echostr;
  })
  .post('/wx/token', function * () {
    this.body = this.query.echostr;
  });

module.exports = app;
