class AddClickCountToPosts < ActiveRecord::Migration[5.2]
  def change
    add_column :posts, :click_count, :Integer
  end
end
