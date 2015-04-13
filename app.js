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
    defer: false
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
    appid: 'wxfe7869827f87e1f8',
    secret: '46ab238379501c7df5eff0318b9162b8',
    token: 'haoduotongshu',
    encodingAESKey: 'TbHRwPloxRMkUHnlDdPp2Pyz48SsAgFsabyoKaKdY9A'
  }
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
var wechatOAuth = new WechatOAuth(options.wechat.appid, options.wechat.secret);
var WechatAPI = require('wechat-api');
var wechatApi = new WechatAPI(options.wechat.appid, options.wechat.secret);

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

    var iswx = /micromessenger/i.test(this.get('user-agent'));

    // not wechat client
    if (!iswx) {
      return yield this.render('layout', {
        partials: {
          content: 'poll/outlets'
        },
        iswx: iswx
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
      },
      iswx: iswx
    });
  })
  .post('/poll/outlets', function * () {
    this.assert(/micromessenger/i.test(this.get('user-agent')), 403, 'wechat only');

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
    this.assert(/micromessenger/i.test(this.get('user-agent')), 403, 'wechat only');

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
      userinfo: userinfo
    };

    if (userinfo.subscribe) {
      this.redirect(this.query.state);
    } else {
      this.redirect('http://mp.weixin.qq.com/s?__biz=MjM5MTI2NDQxMg==&mid=204219959&idx=1&sn=981c14f1870156ffc33076c10b7dab7a#rd'); // jshint ignore:line
    }
  });

// wechat

var wechat = require('co-wechat');

var reply = {
  vote: [{
    title: '投票活动',
    description: '我爱蓝天投票活动',
    picurl: 'http://haoduo.vitarn.com/img/slide-outlets.jpg',
    url: 'http://haoduo.vitarn.com/poll/outlets'
  }],
  
  about: '好多童书专业出版机构，成立于2009年。致力于高品质童书的策划与发行。坚持“以纯净的阅读，沉淀世界的喧嚣”的出版理念，出版图书涵盖家庭教育、少儿读物、人文社科、时尚娱乐、大众生活等多个领域。多年来好多童书不断挖掘品牌的精髓，注重将阅读重新带回纸质实体，享受将知识捧在手心里的感觉。\n咨询电话：0431-85575556', // jshint ignore:line

  smile: '^_^'
};

app.use(wechat(options.wechat).middleware(function * () {
  var weixin = this.weixin;
  var MsgType = weixin.MsgType;

  switch (MsgType) {
    case 'text':
      if (/投票/.test(weixin.Content)) {
        this.body = reply.vote;
      }
      
      if (/优惠/.test(weixin.Content)) {
        var myvote = yield Vote.findOne({
          wxid: weixin.FromUserName
        });
        
        if (myvote) {
          this.body = '感谢您参与投票活动, 您已经把票投给了' + myvote.code + '号小朋友, 附赠微商城10元优惠卷一张, 点击领取: http://wap.koudaitong.com/v2/showcase/coupon/fetch?alias=gtyzq20d'; // jshint ignore:line
        } else {
          this.body = reply.vote;
        }
      }
      break;

    case 'event':
      if (weixin.Event == 'subscribe') {
        this.body = reply.vote;
      }
      
      if (weixin.Event == 'CLICK') {
        if (weixin.EventKey == 'about') {
          this.body = reply.about;
        }
      }
      break;

    default:
      this.body = reply.smile;
  }
}));

// exports

module.exports = app;
