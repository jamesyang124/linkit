require 'uri'
require 'net/http'
require 'net/https'

module OpenImageUrl

  def self.included(klass)
    klass.extend self
  end

  def open_uri_with_redirections(url, hash = nil)
    response = Net::HTTP.get_response(URI(url))
    if response.code == "200"
      uri = response.uri
    elsif response.code == "302"
      uri = response['location']
    end
    if hash != nil && hash.has_key?(:thumbnail_url)
      return uri
    else
      uri = OpenURI.open_uri(uri)
      return uri, uri.meta["content-type"]
    end
  end
end