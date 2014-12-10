
$(document).ready(function(){/* jQuery toggle layout */
  $('#btnToggle').click(function(){
    if ($(this).hasClass('on')) {
      $('#main .col-md-6').addClass('col-md-4').removeClass('col-md-6');
      $(this).removeClass('on');
    }
    else {
      $('#main .col-md-4').addClass('col-md-6').removeClass('col-md-4');
      $(this).addClass('on');
    }
  });

  $("#back-top").click(function(){
    $('html body').animate({
      scrollTop: 0,
      }, 700
    );
  });

  //$("#navp-search").click(function(){
    //$("#srch-term").focus();
  //});

  //$('#navp-share').click(function(){
  //  $('#url').focus();
  //});

  //$( document ).ajaxSuccess(function( event, xhr, settings ) {
  //  console.log(event);
  //  console.log(xhr);
  //  console.log(settings);
  //});
});