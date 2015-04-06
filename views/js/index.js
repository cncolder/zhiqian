var posterAnimate = 'animated bounceIn';
$('.poster a').hover(function() {
  $(this).find('img').addClass(posterAnimate);
}, function() {
  $(this).find('img').removeClass(posterAnimate);
});
