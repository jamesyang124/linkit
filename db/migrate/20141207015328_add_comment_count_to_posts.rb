class AddCommentCountToPosts < ActiveRecord::Migration[5.2]
  def change
    add_column :posts, :comments_count, :integer, default: 0

    Post.all.each do |p|
      p.update_attribute :comments_count, p.comments.length
    end
  end
end
