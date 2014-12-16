/*
--------------------------------
   Infinite Scroll
   --------------------------------
   + https://github.com/paulirish/infinite-scroll
   + version 2.1.0
   + Copyright 2011/12 Paul Irish & Luke Shumard
   + Licensed under the MIT license

   + Documentation: http://infinite-scroll.com/
*/
!function(e){"function"==typeof define&&define.amd?define(["jquery"],e):e(jQuery)}(function(e,t){"use strict";e.infinitescroll=function(t,i,n){this.element=e(n),this._create(t,i)||(this.failed=!0)},e.infinitescroll.defaults={loading:{finished:t,finishedMsg:"",img:"",msg:null,msgText:"",selector:null,speed:"fast",start:t},state:{isDuringAjax:!1,isInvalidPage:!1,isDestroyed:!1,isDone:!1,isPaused:!1,isBeyondMaxPage:!1,currPage:1},debug:!1,behavior:t,binder:e(window),nextSelector:"div.navigation a:first",navSelector:"div.navigation",contentSelector:null,extraScrollPx:150,itemSelector:"div.post",animate:!1,pathParse:t,dataType:"html",appendCallback:!0,bufferPx:40,errorCallback:function(){},infid:0,pixelsFromNavToBottom:2200,path:t,prefill:!1,maxPage:t},e.infinitescroll.prototype={_binding:function(e){var i=this,n=i.options;return n.v="2.0b2.120520",n.behavior&&this["_binding_"+n.behavior]!==t?void this["_binding_"+n.behavior].call(this):"bind"!==e&&"unbind"!==e?(this._debug("Binding value  "+e+" not valid"),!1):("unbind"===e?this.options.binder.unbind("smartscroll.infscr."+i.options.infid):this.options.binder[e]("smartscroll.infscr."+i.options.infid,function(){i.scroll()}),void this._debug("Binding",e))},_create:function(i,n){var o=e.extend(!0,{},e.infinitescroll.defaults,i);this.options=o;var a=e(window),s=this;if(!s._validate(i))return!1;var r=e(o.nextSelector).attr("href");if(!r)return this._debug("Navigation selector not found"),!1;o.path=o.path||this._determinepath(r),o.contentSelector=o.contentSelector||this.element,o.loading.selector=o.loading.selector||o.contentSelector,o.loading.msg=o.loading.msg||e('<div id="infscr-loading"><img alt="Loading..." src="'+o.loading.img+'" /><div>'+o.loading.msgText+"</div></div>"),(new Image).src=o.loading.img,o.pixelsFromNavToBottom===t&&(o.pixelsFromNavToBottom=e(document).height()-e(o.navSelector).offset().top,this._debug("pixelsFromNavToBottom: "+o.pixelsFromNavToBottom));var l=this;return o.loading.start=o.loading.start||function(){e(o.navSelector).hide(),o.loading.msg.appendTo(o.loading.selector).show(o.loading.speed,e.proxy(function(){this.beginAjax(o)},l))},o.loading.finished=o.loading.finished||function(){o.state.isBeyondMaxPage||o.loading.msg.fadeOut(o.loading.speed)},o.callback=function(i,s,r){o.behavior&&i["_callback_"+o.behavior]!==t&&i["_callback_"+o.behavior].call(e(o.contentSelector)[0],s,r),n&&n.call(e(o.contentSelector)[0],s,o,r),o.prefill&&a.bind("resize.infinite-scroll",i._prefill)},i.debug&&(!Function.prototype.bind||"object"!=typeof console&&"function"!=typeof console||"object"!=typeof console.log||["log","info","warn","error","assert","dir","clear","profile","profileEnd"].forEach(function(e){console[e]=this.call(console[e],console)},Function.prototype.bind)),this._setup(),o.prefill&&this._prefill(),!0},_prefill:function(){function t(){return e(i.options.contentSelector).height()<=n.height()}var i=this,n=e(window);this._prefill=function(){t()&&i.scroll(),n.bind("resize.infinite-scroll",function(){t()&&(n.unbind("resize.infinite-scroll"),i.scroll())})},this._prefill()},_debug:function(){!0===this.options.debug&&("undefined"!=typeof console&&"function"==typeof console.log?console.log(1===Array.prototype.slice.call(arguments).length&&"string"==typeof Array.prototype.slice.call(arguments)[0]?Array.prototype.slice.call(arguments).toString():Array.prototype.slice.call(arguments)):Function.prototype.bind||"undefined"==typeof console||"object"!=typeof console.log||Function.prototype.call.call(console.log,console,Array.prototype.slice.call(arguments)))},_determinepath:function(e){var i=this.options;if(i.behavior&&this["_determinepath_"+i.behavior]!==t)return this["_determinepath_"+i.behavior].call(this,e);if(i.pathParse)return this._debug("pathParse manual"),i.pathParse(e,this.options.state.currPage+1);if(e.match(/^(.*?)\b2\b(.*?$)/))e=e.match(/^(.*?)\b2\b(.*?$)/).slice(1);else if(e.match(/^(.*?)2(.*?$)/)){if(e.match(/^(.*?page=)2(\/.*|$)/))return e=e.match(/^(.*?page=)2(\/.*|$)/).slice(1);e=e.match(/^(.*?)2(.*?$)/).slice(1)}else{if(e.match(/^(.*?page=)1(\/.*|$)/))return e=e.match(/^(.*?page=)1(\/.*|$)/).slice(1);this._debug("Sorry, we couldn't parse your Next (Previous Posts) URL. Verify your the css selector points to the correct A tag. If you still get this error: yell, scream, and kindly ask for help at infinite-scroll.com."),i.state.isInvalidPage=!0}return this._debug("determinePath",e),e},_error:function(e){var i=this.options;return i.behavior&&this["_error_"+i.behavior]!==t?void this["_error_"+i.behavior].call(this,e):("destroy"!==e&&"end"!==e&&(e="unknown"),this._debug("Error",e),("end"===e||i.state.isBeyondMaxPage)&&this._showdonemsg(),i.state.isDone=!0,i.state.currPage=1,i.state.isPaused=!1,i.state.isBeyondMaxPage=!1,void this._binding("unbind"))},_loadcallback:function(i,n,o){var a,s=this.options,r=this.options.callback,l=s.state.isDone?"done":s.appendCallback?"append":"no-append";if(s.behavior&&this["_loadcallback_"+s.behavior]!==t)return void this["_loadcallback_"+s.behavior].call(this,i,n,o);switch(l){case"done":return this._showdonemsg(),!1;case"no-append":if("html"===s.dataType&&(n="<div>"+n+"</div>",n=e(n).find(s.itemSelector)),0===n.length)return this._error("end");break;case"append":var c=i.children();if(0===c.length)return this._error("end");for(a=document.createDocumentFragment();i[0].firstChild;)a.appendChild(i[0].firstChild);this._debug("contentSelector",e(s.contentSelector)[0]),e(s.contentSelector)[0].appendChild(a),n=c.get()}if(s.loading.finished.call(e(s.contentSelector)[0],s),s.animate){var d=e(window).scrollTop()+e(s.loading.msg).height()+s.extraScrollPx+"px";e("html,body").animate({scrollTop:d},800,function(){s.state.isDuringAjax=!1})}s.animate||(s.state.isDuringAjax=!1),r(this,n,o),s.prefill&&this._prefill()},_nearbottom:function(){var i=this.options,n=0+e(document).height()-i.binder.scrollTop()-e(window).height();return i.behavior&&this["_nearbottom_"+i.behavior]!==t?this["_nearbottom_"+i.behavior].call(this):(this._debug("math:",n,i.pixelsFromNavToBottom),n-i.bufferPx<i.pixelsFromNavToBottom)},_pausing:function(e){var i=this.options;if(i.behavior&&this["_pausing_"+i.behavior]!==t)return void this["_pausing_"+i.behavior].call(this,e);switch("pause"!==e&&"resume"!==e&&null!==e&&this._debug("Invalid argument. Toggling pause value instead"),e=!e||"pause"!==e&&"resume"!==e?"toggle":e){case"pause":i.state.isPaused=!0;break;case"resume":i.state.isPaused=!1;break;case"toggle":i.state.isPaused=!i.state.isPaused}return this._debug("Paused",i.state.isPaused),!1},_setup:function(){var e=this.options;return e.behavior&&this["_setup_"+e.behavior]!==t?void this["_setup_"+e.behavior].call(this):(this._binding("bind"),!1)},_showdonemsg:function(){var t=this.options;t.errorCallback.call(e(t.contentSelector)[0],"done")},_validate:function(t){for(var i in t)if(i.indexOf&&i.indexOf("Selector")>-1&&0===e(t[i]).length)return this._debug("Your "+i+" found no elements."),!1;return!0},bind:function(){this._binding("bind")},destroy:function(){return this.options.state.isDestroyed=!0,this.options.loading.finished(),this._error("destroy")},pause:function(){this._pausing("pause")},resume:function(){this._pausing("resume")},beginAjax:function(i){var n,o,a,s,r=this,l=i.path;i.state.currPage++;if(i.maxPage!==t&&i.state.currPage>i.maxPage)return i.state.isBeyondMaxPage=!0,void this.destroy();switch(n=e(e(i.contentSelector).is("table, tbody")?"<tbody/>":"<div/>"),o="function"==typeof l?l(i.state.currPage):l.join(i.state.currPage),r._debug("heading into ajax",o),a="html"===i.dataType||"json"===i.dataType?i.dataType:"html+callback",i.appendCallback&&"html"===i.dataType&&(a+="+callback"),a){case"html+callback":r._debug("Using HTML via .load() method"),n.load(o+" "+i.itemSelector,t,function(e){r._loadcallback(n,e,o)});break;case"html":r._debug("Using "+a.toUpperCase()+" via $.ajax() method"),e.ajax({url:o,dataType:i.dataType,complete:function(e,t){s="undefined"!=typeof e.isResolved?e.isResolved():"success"===t||"notmodified"===t,s?r._loadcallback(n,e.responseText,o):r._error("end")}});break;case"json":r._debug("Using "+a.toUpperCase()+" via $.ajax() method"),e.ajax({dataType:"json",type:"GET",url:o,success:function(e,a,l){s="undefined"!=typeof l.isResolved?l.isResolved():"success"===a||"notmodified"===a;var c=!1;if(0===e.length&&(c=!0),i.appendCallback)if(i.template!==t){var d=i.template(e);n.append(d),s?r._loadcallback(n,d):r._error("end")}else r._debug("template must be defined."),r._error("end");else s&&!c?r._loadcallback(n,e,o):c===!0?r._showdonemsg():r._error("end")},error:function(){r._debug("JSON ajax request failed."),r._error("end")}})}},retrieve:function(i){i=i||null;var n=this,o=n.options;return o.behavior&&this["retrieve_"+o.behavior]!==t?void this["retrieve_"+o.behavior].call(this,i):o.state.isDestroyed?(this._debug("Instance is destroyed"),!1):(o.state.isDuringAjax=!0,void o.loading.start.call(e(o.contentSelector)[0],o))},scroll:function(){var e=this.options,i=e.state;return e.behavior&&this["scroll_"+e.behavior]!==t?void this["scroll_"+e.behavior].call(this):void(i.isDuringAjax||i.isInvalidPage||i.isDone||i.isDestroyed||i.isPaused||this._nearbottom()&&this.retrieve())},toggle:function(){this._pausing()},unbind:function(){this._binding("unbind")},update:function(t){e.isPlainObject(t)&&(this.options=e.extend(!0,this.options,t))}},e.fn.infinitescroll=function(t,i){var n=typeof t;switch(n){case"string":var o=Array.prototype.slice.call(arguments,1);this.each(function(){var i=e.data(this,"infinitescroll");return i&&e.isFunction(i[t])&&"_"!==t.charAt(0)?void i[t].apply(i,o):!1});break;case"object":this.each(function(){var n=e.data(this,"infinitescroll");n?n.update(t):(n=new e.infinitescroll(t,i,this),n.failed||e.data(this,"infinitescroll",n))})}return this};var i,n=e.event;n.special.smartscroll={setup:function(){e(this).bind("scroll",n.special.smartscroll.handler)},teardown:function(){e(this).unbind("scroll",n.special.smartscroll.handler)},handler:function(t,n){var o=this,a=arguments;t.type="smartscroll",i&&clearTimeout(i),i=setTimeout(function(){e(o).trigger("smartscroll",a)},"execAsap"===n?0:100)}},e.fn.smartscroll=function(e){return e?this.bind("smartscroll",e):this.trigger("smartscroll",["execAsap"])}});

// script.js
var image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAMAAAC7IEhfAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABDlBMVEWgw/+fwv+ewv+hxP+jxv+nyf+cwP2TuPprlu1UguVIeeKlx/91n/BCc+A8bt4/cd91nvCmyP9umO45bN1DdOBFduFEdeCEq/VFdeBEdOCixf9TguWkx/+Os/hAcd99pfM9b96myf94ofF/p/Okxv+QtvlBct9Yhuc+cN6Ksfc9cN47bd1Bc99/p/RIeOE7bt2avvx2n/FciehQgOWewf6lyP+dwf6ixP+ewv6fw/+bvv2Lsfd6o/Jwmu9ok+xkkOpkj+pnk+tume6HrvaXvPydwf1+pvNei+l5ovJMe+NFdeFtmO6ewf1ciuhPfuSUufo6bN1GduFNfeOcv/2CqfQ7bd46bd10nfCnyP/////26PWZAAAAAWJLR0RZmrL0GAAAAW9JREFUOMvt09lWwjAUBdCkISDEpgaTWBBKKQWKdQJFxXkeKg44//+XWF3qarUpvut53uvc5iYF4D9hoAYQAhoc6zIYZbMIZ8ZIiHMT+UIhP5HD6ZJM6tTQdYPqUyStjxWnuZCcS8Gniwyq3Qw1S/w9JZPOqGV51pD8I9KYLasKK1Xry4XSqlagYnLNjkK7ppgN604cOnVVYyMOG6pGt9nikbSaruLY0G175iczvbbKAUg6Hv8YLvlch6Rs3PHnhQwj5n2Hpdw2ZAuLS55leUuLCyz1VUC23O2trPS6y2zMO1sFfRcAtw/WUvvgOsGEMEYI7pfhxiCZaahONre2d3b39g8OnaNjF5e1pLYBPjk9K1iU2mGob4h29xijH18KkXt+QW2dB8HbegIhdY+Ky+H3pQ/Wh1d+K5DRK5SB7l/ffJeZ3u0oxt4zsu/uUXx9D4+CJ2T09IyjJ9JwkQZJUNr7sc2Hvx81fwXxb+HL34Kv8IZDl7Q2360AAAAldEVYdGRhdGU6Y3JlYXRlADIwMTQtMTItMTRUMjI6MjA6MTEtMDg6MDDE8n5DAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE0LTEyLTE0VDIyOjIwOjExLTA4OjAwta/G/wAAAABJRU5ErkJggg=="

function genIsotypeItems(data, image_link){
  var itemElems = '<div class="isotype-item panel panel-default iso-filter infinite-items new-item"><div class="panel-thumbnail"><a data-no-turbolink="true" href="/redirect/' + data.post_id + '"><img class="img-responsive" ' + image_link + '></a></div><div class="panel-body"><a data-no-turbolink="true" href="/redirect/' + data.post_id + '"><p class="lead" id="iso-filtering">' + data.title + '</p></a><p class="post-body">' + data.body + '</p></div><div class="comments"><p class="pull-left"><b id="comment-' + data.post_id + '">' + data.comments_count + '</b> ' + (data.comments_count > 1 ? ' comments' : ' comment') + '</p><p class="pull-right"> visited <b>' + data.click_count + '</b> ' + (data.click_count > 1 ? ' times' : ' time') + '</p></div>';

  return itemElems;
}

function genCommentForm(data){
  return '<div class="chatbox chatbox-form" id="comment-form-'+ data.post_id +'"><img alt="" class="img-circle" src="' + (data.user_image !== null ? data.user_image : image) + '"><form accept-charset="UTF-8" action="/posts/' + data.post_id + '/comments" class="new_comment" data-remote="true" id="comment-box" method="post"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="✓"></div><textarea class="textarea form-group form-control comment_area" id="comment_comment" name="comment[comment]" placeholder="Add a comment.." rows="3"></textarea><input class="btn btn-sm btn-primary comment-submit" name="commit" type="submit" value="Comment" style="display: none;"></form></div></div></div>';
}

function genElement(data){
  var image_link = data.thumbnail_url != null ? ('src="' + data.thumbnail_url + '"') : 'src ';
  //var data_uri = data.thumbnail_uri != null ? ('src="data:' + data.thumbnail_content_type + ';base64,' + data.thumbnail_uri) + '"' : 'src';

  var itemElems = genIsotypeItems(data, image_link);

  var poster_box = '<div class="chat"><div class="chatbox"><img alt="" class="img-circle" src="' + (data.poster_image != null ? data.poster_image : image) + '"><b id="cname">' + data.poster + '</b><br> via  <b>' + data.provider_name + '</b> on <b>' + data.created_at + '</b></div>';
  
  var comments = "";
  for (var i = 0; i < data.comments.length; i++){
    comments += '<div class="chatbox"><img alt="" class="img-circle" src="' + (data.comments[i].commenter_image != null ? data.comments[i].commenter_image : image) + '"><b id="cname">' + data.comments[i].commenter + '</b><p>'+ data.comments[i].comment +'</p></div>';
  }

  var comment_form = (data.comment_available != null) ? genCommentForm(data) : '</div></div>';

  //console.log((itemElems + poster + comments + comment_form));

  return (itemElems + poster_box + comments + comment_form);
}

$(document).ready(function(){/* jQuery toggle layout */

  $(document).on('click', ".back-top", function(){
    $('html, body').animate({
      scrollTop: 0,
      }, 700
    );
    return false;
  });

  $(document).on('click', '#nav-search', function(){
    $('html, body').animate({
      scrollTop: 0,
      }, 700
    );
    $("#navp-search").click();
    $("#srch-term").focus();
  });

  //$('.comment-submit').hide();
  //$('.isotype').isotope('layout');

  $(document).on('focus', 'textarea.comment_area', function(){
    $('.comment-submit').filter(":visible").hide();
    $(this).next().show();
    $('.isotype').isotope('layout');
  });

  $(document).on('focus', '#url, #srch-term', function(){
    $('.comment-submit').hide();
    $('.isotype').isotope('layout');
  });

  $(document).on('click', ".iso-shuffle", function(){
    $('.isotype').isotope('shuffle');
  });

  $(document).on('"DOMSubtreeModified"', ".selector-wrapper", function(){
    $('.isotype').isotope('layout');
  });

  $(document).on("keyup", '#srch-term', function(){
    $('.isotype').isotope({
      itemSelector: '.isotype-item',
      masonry: {
        gutter: 30
      },
      filter: function() {
        var name = $(this).find('#iso-filtering').text().toLowerCase();
        var search = $('#srch-term').val().toLowerCase();
        return name.match(search);
    }});
  });

  var $container = initIso()

  $($container).imagesLoaded(function() {
    $('.isotype').isotope('layout');
  });

  scr();

});

  document.addEventListener("DOMContentLoaded", function(event) {
    console.log("DOM fully loaded and parsed");
  });

  window.addEventListener("DOMWindowCreated", function(event){
    console.log("qwsqweqwe");
  });

function interval() {
  $( "#load" ).fadeIn(800).fadeOut(800);
};

function initIso(){
  return $('.isotype').isotope({
    // main isotope options
      itemSelector: '.isotype-item',
      masonry: {
        gutter: 30
      }
  });
}

  //$('.comment-submit').hide();
  //$container.isotope('layout');

function scr(){

  $(".isotype").infinitescroll({
    navSelector: "nav.pagination",
    nextSelector: "nav.pagination a[rel=next]",
    itemSelector: ".infinite-items",
    prefill: true,
    dataType: "json",
    loading: {
      start: function(options) {
        $(this).data('infinitescroll').beginAjax(options);
      },
      finished: function() {
      }
    },
    appendCallback: false,
    errorCallback: function(errorType) {
      if (errorType == "done") { 
        //clearInterval(res);

        $("<div class='row'><div class='col-md-alert-head alert alert-warning bottom-alert' id='bottom-msg' role='alert'> No more posts, click to <a class='alert-link' id='bottom-alert' onClick='return false;'> back to top</a></div></div>").insertAfter("#iso-layout");
        
        $("#bottom-alert").click(function(){
            $('html, body').animate({
              scrollTop: 0,
              }, 1500
            );
        });
      }
    }
  }, function(newElements, opts){
    var res = setInterval(interval(), 8);

    var items = "";

    for (var i = 0, len = newElements.length; i < len; i++) {
      var newItem = genElement(newElements[i]);
      items += newItem;
    }

    var $container = $('.isotype').isotope({
    // main isotope options
      itemSelector: '.isotype-item',
      masonry: {
        gutter: 30
      }
    });

    $container.append($(items));
    $('.new-item').css({ opacity: 0 });

    $('.comment_area').blur();
    //$('.comment-submit').hide();
    //$container.isotope('layout');
    //$container.isotope("appended", $('.new-item'));

    $container.imagesLoaded(function() {
      //$container.isotope('layout');
      $container.isotope("appended", $('.new-item'));
      $('.new-item').removeClass('new-item');
      clearInterval(res);
    });
  });

}
