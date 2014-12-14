json.array!(@posts) do |post|
  json.post_id post.id
  json.title post.title
  json.body post.body
  json.provider_name post.provider_name
  json.click_count post.click_count
  json.poster post.user.name
  json.poster_image post.user.image
  json.comments_count post.comments_count
  json.created_at post.created_at.strftime("%m/%d/%Y")
  json.comments post.comments do |c|
    json.comment c.comment
    json.commenter c.user.name
    json.commenter_image c.user.image
  end
  json.thumbnail_url post.thumbnail_url
  
  if current_user
    json.user_image current_user.image
    json.comment_available true
  end
end
