linkit
======

Share links and posts.

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-12-03-1.png)

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-11-25-2.png)

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-10-14.png)

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-10-09.png)

### To-do List

- redirection for counting link clicks => rss guid can be merged by this.
- use `counter_cache: true` to set comments count.
- Email links should direct to **production** url.  

#### Security

- each user access application, a new session will create on server side and send a cookie to client.
- Then application store user id to that session, from now on, every request, the application load user by user id in session.
- The session id in cookie identify the proper session in application.
- To secure cookie => force SSL connection.
- In Rails 2, store session to client side rather than server by CookieStore.
  * Rails will get session hash from client and does not require session id for every request anymore.
  * To prevent session hash tampering, a digest (with SHA1) is calculated from the session with a server-side secret and inserted into the end of the cookie.
- `config.secret_key_base` to customed a key for the SHA1 algorithm.
- In same domain, cookie sent from server and server get client cookie in later every request.
- Cookie store user data, Session store the identity for the user.

### Done Work & Notes

12/06/2014

- Fix issue to directly request an empty page by query string.
- `ri Struct` to find manual in shell.
- Set post order to DESC.
- Reset items opacity animation after ImageLoaded.
- Add a back to top button in nav bar.
- Custom Start and finish loadin effect.
  * [http://thefrontrowblog.tumblr.com/](http://thefrontrowblog.tumblr.com/)
  * [https://github.com/paulirish/infinite-scroll/issues/176](https://github.com/paulirish/infinite-scroll/issues/176)
- Fix Flash message width, add bottom alert message when scroll to last page.
- Use `pluck(:column)` to select single column
- Turbo link will execute request more than 1 time. Disable when you redirect to outside url.
- Add counter cache for comments count.

12/05/2014

- Use **Kaminari** to set pagination, inifinite scroll.
  * [http://www.sitepoint.com/infinite-scrolling-rails-practice/](http://www.sitepoint.com/infinite-scrolling-rails-practice/)
  * [https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a)
  * [https://github.com/metafizzy/isotope/issues/76](https://github.com/metafizzy/isotope/issues/76)
- Remove Infinite Scroll loading image and message.
- User `blur()` to switch show/hide commit button.

12/04/2014

- Add rspec for new scopes: `User::find_emails`, `User::find_email_names`, `Comment::post_commenters`.
- `posts_url`, `url_for` are helpers for getting url string.
- RSS feed done. Use Font Awesome for display icon.
  * [http://apidock.com/rails/v1.0.0/Builder/XmlMarkup](http://apidock.com/rails/v1.0.0/Builder/XmlMarkup)
  * [http://apidock.com/rails/ActionController/Base/url_for](http://apidock.com/rails/ActionController/Base/url_for)
  * [http://railscasts.com/episodes/87-generating-rss-feeds-revised?view=asciicast](http://railscasts.com/episodes/87-generating-rss-feeds-revised?view=asciicast)
  * [http://intertwingly.net/wiki/pie/Rss20AndAtom10Compared](http://intertwingly.net/wiki/pie/Rss20AndAtom10Compared)
- Add `auto_dicover_link_tag` in html header to allow broswer auto detect rss or atom feed reader.

12/03/2014

- Popular email clients like Gmail strip out `<style>` tag. so we alter email's css style tags to inline style. 
- Slim `=>` after `|` left a line for convertion, or next tag may treated as text. 
- Refactor mail params building in Comment controller and Comment Mail Service for mail sending services.  
- Add recipient variables to mailgun message. interpolation by `%recipient.name%`.  
- Email notification now support html template. Designed email html template.  
  * [http://documentation.mailgun.com/user_manual.html#sending-via-api](http://documentation.mailgun.com/user_manual.html#sending-via-api)  
  * [https://ruby-china.org/topics/8155](https://ruby-china.org/topics/8155)  
  
12/02/2014

- done mailgun email notification service.
- put richest content type in last type, text `text/plain` then html `text/html` in last part. So mailgun payload should set `payload[:text]` prior than `payload[:html]`.  
  * [http://www.w3.org/Protocols/rfc1341/7_2_Multipart.html](http://www.w3.org/Protocols/rfc1341/7_2_Multipart.html)  

    > In general, user agents that compose multipart/alternative entities should place the body parts in increasing order of preference, that is, with the preferred format last. For fancy text, the sending user agent should put the plainest format first and the richest format last.

- `Linkit::Application._all_autoload_paths` to get autoload paths, it loads all directories under `./app` folder by default. 

12/01/2014

- Write Omni auth test for User model. Post and Comment model rspec test done too.

11/28/2014

- Use `Fabricate.build` to get instance before save.

11/26/2014

- Build Comment model under Post model. updated nested routes, new comment controller actions, and comments views are modified.
- Fix the js to hide the submit button of unfocused text_area.
- Rspec test for Comment model start.
- Add offset to skip first record for batch fetching.

11/24/2014

- Add chatbox, comment layout.

10/14/2014

- Change `nav-bar` layout, now support client-side search ignore letter case.
- finally add `share links` DOMSubtreeModified javascript, and re-render isotype layout.
  - [https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Mutation_events](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Mutation_events)
  - [https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
10/13/2014

- Integrated with Embed.ly preview.
- `Post` model now save Embedly response object's information.
- [Center input frames](http://stackoverflow.com/questions/18153234/center-a-div-using-bootstrap-3-markup-or-css)
- Dynamic Grid Layout: [isotope](http://isotope.metafizzy.co/index.html)
- Done front end Layout, post now only save unique links.
- Iamge now properly filled through Embed.ly fill api.

10/09/2014

- Change default `font-family` to `font-family: 'Bree Serif', serif`.
- `OmniAuth` integration done. Move facebook sign-in button to login dialog.
- Done `Session#create` through ajax call. Routing path done.

10/08/2014

- Finish `Registration#create` with ajax call. `form_for :model` with predefined model. `@user.errors.message` for flash messages.

- Done `Registration#create`, may rewrite it with `ajax` so don't need to redirect if registration failed.
  - [http://edgeguides.rubyonrails.org/working_with_javascript_in_rails.html](http://edgeguides.rubyonrails.org/working_with_javascript_in_rails.html)
  - send ajax call to server, respond back and modified placeholder message for invalid input. 

- `User` model refine, unused routes removed.

