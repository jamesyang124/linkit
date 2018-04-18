class AddThumbnailColumnsToPosts < ActiveRecord::Migration[5.2]
  def change
    add_column :posts, :thumbnail_url, :string
    add_column :posts, :thumbnail_width, :integer
    add_column :posts, :thumbnail_height, :integer
    #remove_column :posts, :image_url
  end
end
