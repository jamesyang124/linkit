linkit
======

Share links and posts.

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-11-25-2.png)

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-10-14.png)

![](https://github.com/jamesyang124/linkit/blob/master/Screenshot2014-10-09.png)

### To-do List

- Rspec test for all authentication process.
- Infinte scroll :bulb:

### Done Work

12/03/2014

- Refactor mail params building in Comment controller and Comment Mail Service for mail sending services.
- Add recipient variables to mailgun message.
- Email notification now support html template. Designed email html template.
- add rspec for new scopes.

12/02/2014

- done mailgun email notification service.

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

