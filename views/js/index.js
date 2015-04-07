var pathname = location.pathname;

// active nav link
(function () {
  var $active = $('nav a[href="' + pathname + '"]');
  var $li = $active.parents('li');
  
  $li.addClass('active');
})();


var posterAnimate = 'animated bounceIn';
$('.poster a').hover(function() {
  $(this).find('img').addClass(posterAnimate);
}, function() {
  $(this).find('img').removeClass(posterAnimate);
});


var outlets = require('./poll/outlets');
if (pathname.startsWith('/poll/outlets')) {
  outlets();
}
