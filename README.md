linkit
======

- Production URL:
[https://linkit-dev.herokuapp.com/](https://linkit-dev.herokuapp.com/)

Share links and posts.

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-12-07.png)

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-12-03-1.png)

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-11-25-2.png)

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-10-14.png)

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-10-09.png)

### To-do List

- Production with http version.
- Capybara and integration test should on.
- prepare to deploy.
- Email links should direct to **production** url.

### AWS example

- [http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html](http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html)
- [http://www.rubydoc.info/github/aws/aws-sdk-ruby/AWS/S3/S3Object:url_for](http://www.rubydoc.info/github/aws/aws-sdk-ruby/AWS/S3/S3Object:url_for)
- object is a k-v pair, key represent the path to that object.
  - ex: sub folder of bucket root, `/images` will be set as `key: images/`.
  - `client.put_object(bucket_name: "#{bucket_name}", key: "images/#{name}", acl: "public-read", data: file)`, file is a File object which support `#read` method.

### AJAX call

- `ajaxSuccess` listen to the ajax call from document.
- `$.ajax().success()` fire a ajax request.

```ruby
# set form or any POST request to `remote: true`
form_for root_path, remote: true do |f|
  # do something
end

# set action respond to javascript.
def action
  respond_to do |f|
    # instance variables can be called in that template.
    f.js { render "js_file/erb" }
  end
end

# append proper node to current DOM.
```

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

04/19/2018

- flush heroku redis:

```sh
redis-cli -h mummichog.redistogo.com -p 9160 -a ${redis_basic_auth_credential} flushall
```

https://stackoverflow.com/questions/9137500/how-to-wipe-heroku-redis

04/18/2018

- `heroku rake db:migrate` after reset database.

07/20/2015

- Tweak Sign-up failed message's position, no more `margin-left` css.
- Restrict the scheme to 'HTTPS', use `rack-rewrite` to set scheme to `Https` only.
- Fix redirection issue on Cloudinary uploading. Remove api secret and set them to ENV vars.
- Change the type of User model's image column from string to text. So Base64 code can be stored.
- Fix facebook image redirection issue. Try ope that uri, if response coed is 302 then get the redirect location as image url instead.
- Create `Procfile`

  ```sh
  worker: bundle exec sidekiq
  ```

- Deploy to Heroku, set up Sidekiq and Redis by add worker process
- [Heroku support Ruby version](https://devcenter.heroku.com/articles/ruby-support#supported-runtimes)

12/18/2014

- Address image url redirection problem, should send upload to MiniMagick too.
- Now user image use data-uri instead.
- Try move image assets to Cloudinary CDN, should remove data-uri.

12/15/2014

- after render, the smae class element selector will not be bind again.
- Compress ja and css file, ready to deploy.
- Add `Rack::Deflator` before `ActionDispatch::Static` for encoding response as gzip compression.
- Replace `u100.png` and `u40.png` to data uri.
- Precompile assets and refine redundant js code, always put embedly preview in last line of the script.
- Customize Kaminari paginator to always display none.

12/14/2014

- Hash in Sidekiq, use string as key instead of symbols. Sidekiq only use simple JSON types.
- fix error in scroll top js code, store image that file size less than 32767 bytes by data-uri foramt, o.w. upload to AWS.

12/13/2014

- add `link` and `guid` for rss, looking feasible approach to use data uri for image downloading.

12/12/2014

- Use `delegate` from parent node to register events and handlers for all target children now and future.
- to Avoid back top jump around then scroll top, return false for onClick function.
- allowed empty body post.
- failed validation with wrong returned sql message.
- Image file now storing in Amazon S3, compressed by ImageMagick.
  * [http://docs.aws.amazon.com/AWSRubySDK/latest/AWS/S3/S3Object.html](http://docs.aws.amazon.com/AWSRubySDK/latest/AWS/S3/S3Object.html)

12/11/2014

- resize thumbnail by MiniMagick. should execute by sidekiq.
- add link to index ?

12/10/2014

- rewrite DOM generation approach, create element by string instead.

12/09/2014

- redesign loading effect, let it shine.
- Change infinite scroll to get json data, then render the data in client side.
- Infinite scroll now get json data and genreate DOM elements then insert it.
- change `_showdone_message` when ajax call to the end.

12/08/2014

- Redesign input layout. add tabs for search or share link.
- Integrate Search input with Share input. Use tab pills to switch pane.
- Add facvicon.

12/07/2014

- Redesign the layout.
- use `nettop`, `ps aux` to find process and port, `top` only top list processes that have most resource usage.
- `to delete self-signed SSL certificate` go `/usr/local/etc/nginx` and delete `server.crt, server.csr, server.key` files.
- Use pow. after creating project, set `.ruby-version, .ruby-gemset` and export rvm env to `.powenv` by `rvm env . > .powenv`. And don't forget `touch tmp/restart.txt` in your Rails app.
- Because we now go through https, call beack from Omni auth server will now go https(443) to back to our app, set nginx reverse proxy port to `443`, and set facebook site url to `https:app_name.dev`

```sh
server {
        listen       443 ssl;
        server_name  *.dev;

        ssl_certificate      server.crt;
        ssl_certificate_key  server.key;

        ssl_session_cache    shared:SSL:1m;
        ssl_session_timeout  5m;

        ssl_ciphers  HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers  on;

        location / {
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_set_header X-Forwarded-Port 443;
            proxy_redirect off;
            proxy_pass http://127.0.0.1;
        }
    }
```

12/06/2014

- Make AJAX call for comment form. and update comment count. relayout items.
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
- redirection for counting link clicks => rss guid can be merged by this.
- use `counter_cache: true` to set comments count.

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
