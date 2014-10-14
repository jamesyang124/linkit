class Post < ActiveRecord::Base
  belongs_to :user
  validates_uniqueness_of :link

  def save_link(link_url)
    post = self
    
    embedly_api = Embedly::API.new key: ENV["embedly_api_key"]
    obj = embedly_api.oembed :url => link_url
    response = obj.first.marshal_dump

    # call Embedly image resize api to get resized image.
    if response[:thumbnail_url]
      post.thumbnail_url = resize_image_size(response[:thumbnail_width], response[:thumbnail_url])
    else
      post.thumbnail_url = "/blank.png"
    end

    post.link = link_url
    post.title = response[:title]
    post.body = response[:description]

    post.save
  end

  private

  def resize_image_size(width, thumbnail_url)
    if !width.nil? and width < 340
      image_url = "http://i.embed.ly/1/display/fill?color=ddd&height=340&width=340&url=".concat ERB::Util.url_encode(thumbnail_url)
      image_url.concat "&key=#{ENV['embedly_api_key']}"
    else
      thumbnail_url
    end
  end
end