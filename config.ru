# This file is used by Rack-based servers to start the application.

require ::File.expand_path('../config/environment',  __FILE__)
require 'rack/rewrite'
use Rack::Rewrite do
  # rewrite rules here
  #r301 %r{.*}, 'https://linkit-dev.herokuapp.com$&', :scheme => 'http'
end
run Rails.application
