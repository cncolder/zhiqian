var wechat = require('co-wechat');
var Vote = require('./models/vote');

var reply = {
  welcome: [{
    title: '感谢您关注好多童书',
    description: '我爱蓝色的天空活动投票结果已经出炉啦!',
    picurl: 'http://haoduo.vitarn.com/img/slide-outlets.jpg',
    url: 'http://haoduo.vitarn.com/poll/outlets',
  }, ],

  event: [{
    title: '“我爱蓝色的天空”大型儿童现场绘画活动',
    description: '',
    picurl: 'https://mmbiz.qlogo.cn/mmbiz/jgdTwKlhAIg1t2uTdImHiaCVIx6tuPOIiaQ0hc3cptR9XotllsGlE81UjryvibYibiaqcJupqXBicSb9xQJC7NFm0T5A/0',
    url: 'http://mp.weixin.qq.com/s?__biz=MjM5MTI2NDQxMg==&mid=204092376&idx=1&sn=9a363e131f7a7bfb47ada0b075e7ea9f&scene=18#rd',
  }, ],

  expert: [{
    title: '好多专家',
    description: '好多童书理念&好多专家介绍',
    picurl: 'https://mmbiz.qlogo.cn/mmbiz/jgdTwKlhAIjTRybUtyHy6f7nFjq82M5LiaBhnQGGuGbj0UrQ89Dv4juUEicncUiaKc1ib0UNgcCldRxhicTiaIs3H4Mg/0',
    url: 'http://mp.weixin.qq.com/s?__biz=MjM5MTI2NDQxMg==&mid=204204296&idx=1&sn=176069df18a9ef9f5ff211f35acfe769#rd',
  }, ],

  post: [{
    title: '长春本地支持货到付款',
    description: '长春市 朝阳区 西安大路2058号 绿地蓝海B座517室',
    picurl: 'https://mmbiz.qlogo.cn/mmbiz/jgdTwKlhAIia39eFLu30YSwKJZ4lXzPFEU8krM5uxngg2XVsWt43g67Igh1XKMsGzOHMibCUVf2bQjjtGNunDvTQ/0',
    url: 'http://mp.weixin.qq.com/s?__biz=MjM5MTI2NDQxMg==&mid=204468117&idx=1&sn=22eea202afa13efdcaa9b2651d7858a2#rd'
  }, ],

  vote: [{
    title: '投票活动',
    description: '我爱蓝天投票活动',
    picurl: 'http://haoduo.vitarn.com/img/slide-outlets.jpg',
    url: 'http://haoduo.vitarn.com/poll/outlets',
  }, ],

  about: '好多童书专业出版机构，成立于2009年。致力于高品质童书的策划与发行。坚持“以纯净的阅读，沉淀世界的喧嚣”的出版理念，出版图书涵盖家庭教育、少儿读物、人文社科、时尚娱乐、大众生活等多个领域。多年来好多童书不断挖掘品牌的精髓，注重将阅读重新带回纸质实体，享受将知识捧在手心里的感觉。\n咨询电话：0431-85575556',

  service: {
    type: 'customerService',
  },

  unknown: '[疑问]',
};

function votecode(code) {
  return '您是要投票给' + code + '号小朋友吗? [疑问] 投票地址在这里: http://haoduo.vitarn.com/poll/outlets';
}

function * coupon(wxid) {
  var vote = yield Vote.findOne({
    wxid: wxid,
  });

  if (vote) {
    return '感谢您参与投票活动, 您已经把票投给了' + vote.code + '号小朋友, 附赠微商城10元优惠卷一张, 点击领取: http://wap.koudaitong.com/v2/showcase/coupon/fetch?alias=gtyzq20d';
  }

  return reply.vote;
}

function * text(weixin) {
  var FromUserName = weixin.FromUserName;
  var Content = weixin.Content;

  if (/投票/.test(Content)) {
    return reply.vote;
  }

  if (/优惠|奖品/.test(Content)) {
    return yield coupon(FromUserName);
  }

  if (/^\d{3}$/.test(Content)) {
    var number = parseInt(Content, 10);

    if (number >= 101 && number <= 310) {
      return votecode(Content);
    }
  }

  return reply.service;
}

function * event(weixin) {
  if (weixin.Event == 'subscribe') {
    return reply.vote;
  }

  if (weixin.Event == 'CLICK') {
    if (weixin.EventKey == 'event') {
      return reply.event;
    }

    if (weixin.EventKey == 'coupon') {
      return yield coupon(weixin.FromUserName);
    }

    if (weixin.EventKey == 'expert') {
      return reply.expert;
    }

    if (weixin.EventKey == 'post') {
      return reply.post;
    }

    if (weixin.EventKey == 'about') {
      return reply.about;
    }
  }

  return reply.unknown;
}

module.exports = function(options) {
  return wechat(options).middleware(function * () {
    var weixin = this.weixin;
    var MsgType = weixin.MsgType;

    if (MsgType == 'text') {
      this.body = yield text(weixin);
    } else if (MsgType == 'event') {
      this.body = yield event(weixin);
    } else {
      this.body = reply.smile;
    }
  });
};
