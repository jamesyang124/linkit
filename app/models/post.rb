class Post < ActiveRecord::Base
  belongs_to :user
  validates_presence_of :user_id, :title, :body, :provider_name, :link
  validates_uniqueness_of :link
  acts_as_commentable

  # paginates_per 4

  #before_save :set_default_click_count

  def save_link(link_url)
    post = self
    
    embedly_api = Embedly::API.new key: ENV["embedly_api_key"]
    obj = embedly_api.oembed :url => link_url
    response = obj.first.marshal_dump

    # call Embedly image resize api to get resized image.
    if response[:thumbnail_url]
      post.thumbnail_url = resize_image_size(response[:thumbnail_width], response[:thumbnail_url])
    end

    post.link = link_url
    post.title = response[:title]
    post.body = response[:description]
    post.provider_name = response[:provider_name] || "Unknown source"

    post.save
  end

  #def set_default_click_count
  #  click_count ||= 0
  #end

  private

  def resize_image_size(width, thumbnail_url)
    if width.nil? || width < 340
      image_url = "http://i.embed.ly/1/display/fill?color=fff&height=340&width=340&url=".concat ERB::Util.url_encode(thumbnail_url)
      image_url.concat "&key=#{ENV['embedly_api_key']}"
    else
      thumbnail_url
    end
  end
end