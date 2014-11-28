Fabricator(:post) do 
  transient :user, :link_url
  user_id { |attrs| attrs[:user] }
  link { |attrs| attrs[:link_url] }
  thumbnail_url nil
  title { "Post test title" }
  body { "Post test body" }
  provider_name { "Post test provider_name" }
end