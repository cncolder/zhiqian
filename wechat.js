var wechat = require('co-wechat');

var reply = {
  vote: [{
    title: '投票活动',
    description: '我爱蓝天投票活动',
    picurl: 'http://haoduo.vitarn.com/img/slide-outlets.jpg',
    url: 'http://haoduo.vitarn.com/poll/outlets'
  }],
  
  smile: '^_^'
};

module.exports = function(options) {
  return wechat(options).middleware(function * () {
    var weixin = this.weixin;
    var MsgType = weixin.MsgType;

    switch (MsgType) {
      case 'text':
        if (/投票/.test(weixin.Content)) {
          this.body = reply.vote;
        }
        break;

      case 'event':
        if (weixin.Event == 'subscribe') {
          this.body = reply.vote;
        }
        break;

      default:
        this.body = reply.smile;
    }
  });
};
