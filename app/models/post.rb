class Post < ActiveRecord::Base
  include OpenImageUrl

  belongs_to :user
  validates_presence_of :user_id, :title, :provider_name, :link
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

      begin
        uri = open_uri_with_redirections(response[:thumbnail_url], thumbnail_url: true)

        image = MiniMagick::Image.open(uri.to_s)
        image.combine_options do |i|
          # if lareger resize to width 319
          i.resize "354x>"
          # if smaller resize to width 319
          i.resize "354x<"
          i.quality 85
        end

        post.thumbnail_url = FileUploadService.upload_link(image.path, image);
      rescue StandardError => e
        logger.error(e.message)
      end
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


  #def resize_image_size(width, thumbnail_url)
  #  if width.nil? || width != 319
  #    image_url = "//i.embed.ly/1/image/resize?grow=true&width=319&height=319&url=".concat ERB::Util.url_encode(thumbnail_url)
  #    image_url.concat "&key=#{ENV['embedly_api_key']}"
  #  else
  #    thumbnail_url
  #  end
  #end
end
