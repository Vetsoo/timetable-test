(function ($) {
      var current_position = 0;
      var total_stage = $('.lineup-stage').length;
      var _width

      $(document).ready(function() {
        if (total_stage < 2) {
          $('.view-pager').remove();
        }
      });

      $('.pager-next').click(function (evt) {

        evt.preventDefault();

        _width = (parseInt($('.lineup-stage').width()) + parseInt($('.lineup-stage').css('margin-right')));

        if (!$(this).hasClass("disabled")) {
          current_position++;
        }

        $('.lineup-stage:nth-child(' + current_position + ')').css('opacity', 0);


        $('.pager-prev').removeClass("disabled");

        if (current_position > (total_stage - 2)) {
          $(this).addClass("disabled");
        } else {
          $(this).removeClass("disabled");
        }

        $('.lineup-stages').css("margin-left", '-' + (current_position * _width) + 'px');
      });

      $('.pager-prev').click(function (evt) {
        evt.preventDefault();

        _width = (parseInt($('.lineup-stage').width()) + parseInt($('.lineup-stage').css('margin-right')));

        $('.lineup-stage:nth-child(' + current_position + ')').css('opacity', 1);

        if (!$(this).hasClass("disabled")) {
          current_position--;
        }

        $('.pager-next').removeClass("disabled");

        if (current_position < 1) {

          $(this).addClass("disabled");
        } else {
          $(this).removeClass("disabled");
        }

        $('.lineup-stages').css("margin-left", '-' + (current_position * _width) + 'px');
      });
    }
)(jQuery);


