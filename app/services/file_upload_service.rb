require 'aws-sdk'

class FileUploadService 

  # use AWS omniauth authentication
  def self.upload_link(image_path, image)
    key_path = "images/#{image_path.split('/').last}"

    s3 = AWS::S3.new(
      access_key_id: ENV['amazon_s3_key'],
      secret_access_key: ENV['amazon_s3_secret'])

    file = File.read(image_path)
    data_uri = Base64.encode64(File.read(image_path))

    # IE 8 support. data uri should less than 32768 bytes
    if data_uri.size >= 32767
      s3.buckets['linkit-jy124'].objects[key_path].write(file, acl: :public_read, content_type: image.mime_type, expires: "Fri, 25 Dec 2037 23:59:59 GMT")
      link = s3.buckets['linkit-jy124'].objects[key_path].public_url.to_s[6..-1]
    else
      link = "data:" << image.mime_type << ";base64," << data_uri
    end
    link
  end
end