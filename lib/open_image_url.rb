require 'uri'
require 'net/http'
require 'net/https'

module OpenImageUrl

  def self.included(klass)
    klass.extend self
  end

  def open_uri_with_redirections(url)
    response = Net::HTTP.get_response(URI(url))
    if response.code == "200"
      uri = response.uri
    elsif response.code == "302"
      uri = response['location']
    end
    #uri = OpenURI.open_uri(url, :allow_redirections => sym_param)
    uri
  end
end