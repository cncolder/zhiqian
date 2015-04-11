// log
var log = require('./debug')('index');

// global
var pathname = location.pathname;

// active nav link
(function () {
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
if (!pathname.indexOf('/poll/outlets')) {
  outlets();
}
