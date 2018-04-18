class SetColumnToPosts < ActiveRecord::Migration[5.2]
  def change
    change_column :posts, :click_count, :integer, default: 0
  end
end
