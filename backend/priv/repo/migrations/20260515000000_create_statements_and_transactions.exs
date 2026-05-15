defmodule WorthMe.Repo.Migrations.CreateStatementsAndTransactions do
  use Ecto.Migration

  def change do
    create table(:statements, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :provider, :string, null: false
      add :statement_period, :string
      add :currency, :string
      add :balance, :decimal
      add :summary, :map
      add :meta, :map

      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false

      timestamps()
    end

    create index(:statements, [:user_id, :provider])
    create index(:statements, [:user_id, :inserted_at])

    create table(:statement_transactions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :occurred_on, :date
      add :occurred_at, :string
      add :narrative, :text
      add :debit, :decimal
      add :credit, :decimal
      add :balance, :decimal
      add :raw, :map

      add :statement_id, references(:statements, type: :binary_id, on_delete: :delete_all), null: false

      timestamps()
    end

    create index(:statement_transactions, [:statement_id])
    create index(:statement_transactions, [:statement_id, :occurred_on])
  end
end

