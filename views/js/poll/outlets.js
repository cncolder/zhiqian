var log = require('../debug')('poll:outlets');
var moment = require('../moment');
var animationend = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';

module.exports = function() {
  // search code or name
  var $searchInput = $('.poll input[type=search]');

  $searchInput.on('input', function(e) {
    var val = $(e.currentTarget).val();

    $('.poll .drawing').each(function(i, el) {
      var $el = $(el);
      var data = $el.data();

      if (data.code.toString().includes(val) || data.name.includes(val)) {
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

  // lazy load images
  $('.poll img.lazy').lazyload({
    effect: 'fadeIn'
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
      .attr('src', '/img/poll/outlets/800/' + data.code + ' ' + data.name + '.jpg');

    $modal.data(data);
  });

  // vote button action
  var $voteButton = $('.drawing-modal button.btn-primary');
  $voteButton.click(function() {
    $voteButton.attr('disabled', true);
    $.post('/poll/outlets', {
      code: $modal.data('code')
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
        if (xhr.status == 409) {
          $voteButton.addClass('hidden');

          var vote = JSON.parse(xhr.responseText);
          var time = moment(vote.createdAt).fromNow();

          alert('您在' + time + '把票投给了' + vote.code + '号小朋友.');
        } else {
          $voteButton.attr('disabled', false);
        }
      });
  });
};
