// log
var log = require('./debug')('index'); // jshint ignore:line

// baidu tongji
var _hmt = _hmt || [];

(function() {
  var hm = document.createElement('script');
  hm.src = '//hm.baidu.com/hm.js?45167ca2620c01d8cc4119ee792fd5a4';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(hm, s);
})();

// global
var pathname = location.pathname;

// active nav link
(function() {
  var $active = $('nav a[href="' + pathname + '"]');
  var $li = $active.parents('li');

  $li.addClass('active');
})();

// tooltip
$('[data-toggle="tooltip"]').tooltip();

// poster button animate
var posterAnimate = 'animated bounceIn';
$('.poster a').hover(function() {
  $(this).find('img').addClass(posterAnimate);
}, function() {
  $(this).find('img').removeClass(posterAnimate);
});

// outlets poll page
var outlets = require('./poll/outlets');
// this line means must start with string. (why i wrote like this!)
if (!pathname.indexOf('/poll/outlets')) {
  outlets();
}
