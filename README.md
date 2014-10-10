linkit
======

Left public posts by any facebook users.

### To-do List

- Decide Posts layout.
- Rspec test for all authentication process.

### Done Work

10/09/2014

- `OmniAuth` integration done. Move facebook sign-in button to login dialog.

10/09/2014

- Done `Session#create` through ajax call. Routing path done.

10/08/2014

- Finish `Registration#create` with ajax call. `form_for :model` with predefined model. `@user.errors.message` for flash messages.

- Done `Registration#create`, may rewrite it with `ajax` so don't need to redirect if registration failed.
  - [http://edgeguides.rubyonrails.org/working_with_javascript_in_rails.html](http://edgeguides.rubyonrails.org/working_with_javascript_in_rails.html)
  - send ajax call to server, respond back and modified placeholder message for invalid input. 

- `User` model refine, unused routes removed.

