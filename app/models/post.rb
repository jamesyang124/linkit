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
      
      # file uplaoding, put to lib in later
    
      image = MiniMagick::Image.open(response[:thumbnail_url])
      
#      require 'pry'; binding.pry

      image.combine_options do |i|
        # if lareger resize to width 319
        i.resize "319x>"
        # if smaller resize to width 319
        i.resize "319x<"
        i.quality 92
      end

      image_name = image.path.split("/").last


      # uploading to box
      @box_session = FileUploadService.authentication();





      image.write("#{Rails.root}/public/images/#{image_name}")
      #post.thumbnail_url = resize_image_size(response[:thumbnail_width], response[:thumbnail_url])
      post.thumbnail_url = "/images/#{image_name}"
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
    if width.nil? || width != 319
      image_url = "//i.embed.ly/1/image/resize?grow=true&width=319&height=319&url=".concat ERB::Util.url_encode(thumbnail_url)
      image_url.concat "&key=#{ENV['embedly_api_key']}"
    else
      thumbnail_url
    end
  end
end