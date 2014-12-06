xml.instruct!
xml.rss version: "2.0" do 
  xml.channel do 
    xml.title "Linkit posts"
    xml.description "Share all public posts"
    xml.link posts_url

    @posts.each do |post|
      xml.item do 
        xml.title post.title
        xml.author post.user.email + " (#{post.user.name})"
        xml.description post.body
        xml.pubDate post.created_at.to_s(:rfc822)
      end
    end
  end
end