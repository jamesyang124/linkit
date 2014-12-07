class ChangeClickCountToPosts < ActiveRecord::Migration
  def change
    change_column :posts, :click_count, :integer
  end
end
