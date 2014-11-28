Fabricator(:comment) do 
  commentable(fabricator: :post)
  commentable_type { |attrs| attrs[:commentable].class.to_s }
  comment "Lorem Ipsum"
end