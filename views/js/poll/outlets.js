module.exports = function() {
  var $searchInput = $('.poll input[type=search]');
  var $searchButton = $('.poll button');

  $searchInput.on('input', function(e) {
    var val = $(e.currentTarget).val();

    $('.poll .drawing').each(function(i, el) {
      var $el = $(el);
      var code = $el.data('code').toString();
      var name = $el.data('name').toString();

      if (code.includes(val) || name.includes(val)) {
        $el.show();
      } else {
        $el.hide();
      }
    });
  });

  $('.drawing-modal').on('show.bs.modal', function(e) {
    var $a = $(e.relatedTarget);
    var $drawing = $a.parents('.drawing');
    var code = $drawing.data('code').toString();
    var name = $drawing.data('name').toString();
    var modal = $(this);
    modal.find('.modal-title').text(code + ' - ' + name);
    modal.find('.modal-body img').attr('src', '/img/poll/outlets/drawing.800.jpg');
  });
};
