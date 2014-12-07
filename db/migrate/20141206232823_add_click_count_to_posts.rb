class AddClickCountToPosts < ActiveRecord::Migration
  def change
    add_column :posts, :click_count, :Integer
  end
end
