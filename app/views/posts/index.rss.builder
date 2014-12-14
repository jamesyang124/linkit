xml.instruct!
xml.rss version: "2.0" do 
  xml.channel do 
    xml.title "Linkit posts"
    xml.description "Share all public posts"
    xml.link posts_url

    Post.includes([:user]).each do |post|
      xml.item do 
        xml.link post.link
        xml.title post.title
        xml.author post.user.email + " (#{post.user.name})"
        xml.description post.body
        xml.pubDate post.created_at.to_s(:rfc822)
        xml.guid post.link
      end
    end
  end
end