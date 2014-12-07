class SetColumnToPosts < ActiveRecord::Migration
  def change
    change_column :posts, :click_count, :integer, default: 0
  end
end
