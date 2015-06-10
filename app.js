// require

var log = require('./lib/debug')('app'); // jshint ignore:line
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
    maxage: ms('1 hour'),
    // index: 'index.html',
    // hidden: false,
    defer: false,
  },

  polyfills: {
    path: '/js/polyfill.js',
  },

  session: {
    store: require('./models/mongoose').sessionStore,
  },

  views: {
    path: './views',
    default: 'html',
    map: {
      html: 'hogan',
    },
  },

  wechat: {
    appid: 'wxfe7869827f87e1f8',
    secret: '46ab238379501c7df5eff0318b9162b8',
    token: 'haoduotongshu',
    encodingAESKey: 'TbHRwPloxRMkUHnlDdPp2Pyz48SsAgFsabyoKaKdY9A',
  },
};

if (app.env == 'development') {
  options.fileServer.maxage = 0;
}

var cache = {};

// response time

app.use(require('koa-response-time')());

// logger

// if (app.env == 'development') {
app.use(require('koa-logger')(options.logger));
// }

// compress

app.use(require('koa-compress')(options.compress));

// polyfills

// app.use(require('koa-polyfills')(options.polyfills));

// file server

app.use(require('koa-static')(options.fileServer.root, options.fileServer));

// cros

app.use(require('koa-cors')());

// session

app.use(require('koa-generic-session')(options.session));

// view renderer

app.use(require('koa-views')(options.views.path, options.views));

// body

require('koa-body-parsers')(app);

// json

app.use(require('koa-json')());

// wechat

app.use(function*(next) {
  // Mozilla/5.0 (iPhone; CPU iPhone OS 8_1_2 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Mobile/12B440 MicroMessenger/6.1.4 NetType/WIFI
  this.iswx = /micromessenger/i.test(this.get('user-agent'));

  yield next;
});

// router

var router = require('koa-router');

var Vote = require('./models/vote');

var WechatOAuth = require('wechat-oauth');
var wechatOAuth = new WechatOAuth(options.wechat.appid, options.wechat.secret);
var WechatAPI = require('wechat-api');
var wechatApi = new WechatAPI(options.wechat.appid, options.wechat.secret);

var outletsDue = Date.parse('2015-05-02T00:00:00+0800');

app
  .use(router(app))
  .get('/', function*() {
    this.state = {
      title: '好多童书 - 知谦文化传播',
    };

    yield this.render('layout', {
      partials: {
        content: 'index',
      },
    });
  })
  .get('/company', function*() {
    yield this.render('layout', {
      partials: {
        content: 'company',
        navlist: 'navlist',
      },
      title: '公司概况',
    });
  })
  .get('/business', function*() {
    yield this.render('layout', {
      partials: {
        content: 'business',
        navlist: 'navlist',
      },
      title: '经营业务',
    });
  })
  .get('/product', function*() {
    yield this.render('layout', {
      partials: {
        content: 'product',
        navlist: 'navlist',
      },
      title: '产品中心',
    });
  })
  .get('/team', function*() {
    yield this.render('layout', {
      partials: {
        content: 'team',
      },
    });
  })
  .get('/poll/outlets', function*() {
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
          name: arr[1],
        };
      });
    }

    var votes = yield Vote.aggregate()
      .match({
        category: 'outlets',
      })
      .group({
        _id: '$code',
        count: {
          $sum: 1,
        },
      }).exec();

    votes.forEach(function(vote) {
      cache.outlets.find(function(option) {
        return option.code == vote._id;
      }).vote = vote.count;
    });

    // vote event has finished.
    if (Date.now() > outletsDue) {
      var options = cache.outlets
        .sort(function(a, b) {
          return (b.vote || 0) - (a.vote || 0);
        })
        .slice(0, 50)
        .map(function(a) {
          a.count = (a.vote || 0) + 20;
          return a;
        });

      this.state = {
        options: options,
      };

      yield this.render('layout', {
        partials: {
          content: 'poll/outlets-result',
        },
        title: '我爱蓝天投票活动获奖名单 - 好多童书',
      });

      return;
    }

    // not wechat client
    if (!this.iswx) {
      return yield this.render('layout', {
        partials: {
          content: 'poll/outlets',
        },
        iswx: this.iswx,
      });
    }

    if (!this.session.wx || !this.session.wx.code) {
      var url = wechatOAuth.getAuthorizeURL(
        'http://haoduo.vitarn.com/wx/authorize', '/poll/outlets', 'snsapi_base'
      );

      return this.redirect(url);
    }

    delete this.session.wx.code;

    var wxid = this.session.wx.openid;
    var myvote = yield Vote.findOne({
      wxid: wxid,
    });

    if (myvote) {
      myvote = myvote.toJSON();
      myvote.name = cache.outlets.find(function(item) {
        return item.code == myvote.code;
      }).name;
    }

    this.state = {
      myvote: myvote,
      options: cache.outlets.sort(function(a, b) {
        return (b.vote || 0) - (a.vote || 0);
      }),
    };

    yield this.render('layout', {
      partials: {
        content: 'poll/outlets',
      },
      title: '我爱蓝天儿童现场绘画活动投票 - 好多童书',
      iswx: this.iswx,
    });
  })
  .post('/poll/outlets', function*() {
    this.assert(this.iswx, 403, 'wechat only');
    this.assert(Date.now() < outletsDue, 403, 'event finished');

    var wxid = this.session.wx.openid;
    var ip = this.ip;
    var vote = yield Vote.findOne({
      wxid: wxid,
    });

    this.assert(!vote, 409, JSON.stringify(vote));

    var body = yield this.request.urlencoded();
    vote = yield Vote.create({
      category: 'outlets',
      code: body.code,
      wxid: wxid,
      ip: ip,
    });
    this.body = vote;
  })
  .get('/wechat', function*() {
    if (/micromessenger/i.test(this.get('user-agent'))) {
      yield this.render('wechat.m.html');
    } else {
      yield this.render('layout', {
        partials: {
          content: 'wechat',
        },
      });
    }
  })
  .get('/wx/authorize', function*() {
    this.assert(this.iswx, 403, 'wechat only');

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
      code: code,
      openid: openid,
      userinfo: userinfo,
    };

    var subscribeGuide = 'http://mp.weixin.qq.com/s' +
      '?__biz=MjM5MTI2NDQxMg==' +
      '&mid=204219959&idx=1' +
      '&sn=981c14f1870156ffc33076c10b7dab7a#rd';

    if (userinfo.subscribe) {
      this.redirect(this.query.state);
    } else {
      this.redirect(subscribeGuide);
    }
  })
  .get('/app/finddiff', function*() {
    yield this.render('layout', {
      partials: {
        content: 'app/finddiff',
      },
      title: '找不同 - 宝宝奇趣 - App 下载 - 好多童书 - 知谦文化传播',
    });
  })
  .get('/privacy', function*() {
    yield this.render('layout', {
      partials: {
        content: 'privacy',
      },
    });
  });

// wechat

app.use(require('./wechat')(options.wechat));

// exports

module.exports = app;
