var log = require('../debug')('poll:outlets'); // jshint ignore:line
// var moment = require('../moment');
var animationend = [
  'webkitAnimationEnd',
  'mozAnimationEnd',
  'MSAnimationEnd',
  'oanimationend',
  'animationend',
].join(' ');

// lazy load images
$(function() {
  $('img').unveil();
});

module.exports = function() {
  // search code or name
  var $searchInput = $('.poll input[type=search]');

  $searchInput.on('input', function(e) {
    var val = $(e.currentTarget).val();

    $('.poll .drawing').each(function(i, el) {
      var $el = $(el);
      var data = $el.data();

      if (~data.code.toString().indexOf(val) || ~data.name.indexOf(val)) {
        $el.show();
      } else {
        $el.hide();
      }
    });

    $(this).trigger('scroll');
  });

  // drawing order
  $('.poll span.badge').slice(0, 50).each(function(index, el) {
    $(el).text(index + 1);
  });

  // copy select drawing data to modal
  var $modal = $('.drawing-modal');
  $modal.on('show.bs.modal', function(e) {
    var $a = $(e.relatedTarget);
    var $drawing = $a.parents('.drawing');
    var data = $drawing.data();

    var $modal = $(this);
    $modal.find('.modal-title')
      .text(data.code + ' - ' + data.name);
    $modal.find('.modal-body img')
      .attr('src',
        'http://123.57.151.44/img/poll/outlets/800/' +
        data.code + ' ' + data.name + '.jpg');

    $modal.data(data);
  });

  // vote button action
  var $voteButton = $('.drawing-modal button.btn-primary');
  $voteButton.click(function() {
    $voteButton.attr('disabled', true);
    $.post('/poll/outlets', {
      code: $modal.data('code'),
    })
      .then(function(vote) {
        $voteButton.addClass('hidden');

        var $img = $('.drawing-modal img.vote-drawing');
        var $result = $('.drawing-modal .vote-result');

        $img.addClass('animated bounceOutUp');
        $img.one(animationend, function() {
          $img.addClass('hidden');

          $result.removeClass('hidden');
          $result.addClass('animated bounceInUp');
          $result.one(animationend, function() {
            $result.removeClass('animated bounceInUp');
          });
        });
      }, function(xhr) {
        var status = xhr.status;
        var responseText = xhr.responseText;

        if (status == 403) {
          if (responseText == 'wechat only') {
            alert('仅对微信用户开放.');
          } else if (responseText == 'event finished') {
            alert('活动已结束.');
          } else {
            alert(responseText);
          }
        } else if (status == 409) {
          $voteButton.addClass('hidden');

          var vote = JSON.parse(responseText);
          // var time = moment(vote.createdAt).fromNow();

          alert('您已经把票投给了' + vote.code + '号小朋友.');
        } else {
          $voteButton.attr('disabled', false);
        }
      });
  });
};
