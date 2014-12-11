function genElement(data){
  var itemElems = '<div class="isotype-item panel panel-default iso-filter infinite-items new-item"><div class="panel-thumbnail"><a data-no-turbolink="true" href="/redirect/' + data.post_id + '"><img class="img-responsive" src="' + data.thumbnail_url + '" style="width: "319px";"></a></div><div class="panel-body"><a data-no-turbolink="true" href="/redirect/' + data.post_id + '"><p class="lead" id="iso-filtering">' + data.title + '</p></a><p class="post-body">' + data.body + '</p></div><div class="comments"><p class="pull-left"><b id="comment-' + data.post_id + '">' + data.comments_count + '</b> ' + (data.comments_count > 1 ? ' comments' : ' comment') + '</p><p class="pull-right"> visited <b>' + data.click_count + '</b> ' + (data.click_count > 1 ? ' times' : ' time') + '</p></div>';

  var poster_box = '<div class="chat"><div class="chatbox"><img alt="" class="img-circle" src="' + (data.poster_image !== null ? data.poster_image : "/assets/pink-30x30.png") + '"><b id="cname">' + data.poster + '</b><br> via  <b>' + data.provider_name + '</b> on <b>' + data.created_at + '</b></div>';
  
  var comments = "";
  for (var i = 0; i < data.comments.length; i++){
    comments += '<div class="chatbox"><img alt="" class="img-circle" src="' + (data.comments[i].commenter_image !== null ? data.comments[i].commenter_image : "/assets/pink-30x30.png") + '"><b id="cname">' + data.comments[i].commenter + '</b><p>'+ data.comments[i].comment +'</p></div>';
  }

  var comment_form = '<div class="chatbox chatbox-form" id="comment-form-'+ data.post_id +'"><img alt="" class="img-circle" src="' + (data.user_image !== null ? data.user_image : "/assets/pink-30x30.png") + '"><form accept-charset="UTF-8" action="/posts/' + data.post_id + '/comments" class="new_comment" data-remote="true" id="comment-box" method="post"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="✓"></div><textarea class="textarea form-group form-control comment_area" id="comment_comment" name="comment[comment]" placeholder="Add a comment.." rows="3"></textarea><input class="btn btn-sm btn-primary comment-submit" name="commit" type="submit" value="Comment" style="display: none;"></form></div></div></div>';

  //console.log((itemElems + poster + comments + comment_form));

  return (itemElems + poster_box + comments + comment_form);
}

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

  $('#nav-search').click(function(){
    $('html body').animate({
      scrollTop: 0,
      }, 700
    );
    $("#navp-search").click();
    $("#srch-term").focus();

  });
});