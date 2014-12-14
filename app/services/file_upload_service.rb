require 'aws-sdk'

class FileUploadService 

  # use AWS omniauth authentication
  def self.upload_link(image_path, image)
    #client = AWS::S3::Client.new(
    #  access_key_id: ENV['amazon_s3_key'],
    #  secret_access_key: ENV['amazon_s3_secret']
    #)

    #file = File.open(image_path,'r')
    key_path = "images/#{image_path.split('/').last}"
    #client.put_object(bucket_name: "linkit-jy124", key: key_path, acl: "public-read", data: file)

    #require 'pry'; binding.pry

    s3 = AWS::S3.new(
      access_key_id: ENV['amazon_s3_key'],
      secret_access_key: ENV['amazon_s3_secret'])

    #require 'pry'; binding.pry    

    file = File.read(image_path)
    data_uri = Base64.encode64(File.read(image_path))

    # IE 8 support.
    if data_uri.size >= 32767
      s3.buckets['linkit-jy124'].objects[key_path].write(file, acl: :public_read, content_type: image.mime_type)
      link = s3.buckets['linkit-jy124'].objects[key_path].public_url.to_s
    else
      link = "data:" << image.mime_type << ";base64," << data_uri
    end
    #require 'pry'; binding.pry
    link
  end
end