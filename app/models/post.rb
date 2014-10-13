class Post < ActiveRecord::Base
  belongs_to :user

  def save_link(link_url)
    post = self
    
    embedly_api = Embedly::API.new key: ENV["embedly_api_key"]
    obj = embedly_api.oembed :url => link_url
    response = obj.first.marshal_dump

    post.link = link_url
    post.title = response[:title]
    post.thumbnail_url = response[:thumbnail_url]
    post.thumbnail_width = response[:thumbnail_width]
    post.thumbnail_height = response[:thumbnail_height]
    post.body = response[:description]
    post.save

    require 'pry'; binding.pry
  end
end