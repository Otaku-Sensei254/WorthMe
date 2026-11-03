defmodule WorthMe.Repo.Migrations.CreatePlanningItems do
  use Ecto.Migration

  def change do
    create table(:recurring_expenses, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :name, :string, null: false
      add :category, :string, null: false
      add :amount, :decimal, precision: 19, scale: 2, null: false
      add :due_day, :integer, null: false
      add :active, :boolean, null: false, default: true
      timestamps()
    end

    create index(:recurring_expenses, [:user_id, :active])

    create table(:financial_goals, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :title, :string, null: false
      add :category, :string, null: false, default: "Personal"
      add :target_amount, :decimal, precision: 19, scale: 2, null: false
      add :saved_amount, :decimal, precision: 19, scale: 2, null: false, default: 0
      add :horizon_months, :integer, null: false
      add :target_date, :date, null: false
      timestamps()
    end

    create index(:financial_goals, [:user_id])
  end
end
