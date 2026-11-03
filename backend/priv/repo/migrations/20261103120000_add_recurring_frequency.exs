defmodule WorthMe.Repo.Migrations.AddRecurringFrequency do
  use Ecto.Migration

  def change do
    alter table(:recurring_expenses) do
      add :frequency, :string, null: false, default: "monthly"
      add :due_month, :integer
      add :due_weekday, :integer
      modify :due_day, :integer, null: true
    end
  end
end
