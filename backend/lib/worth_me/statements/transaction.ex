defmodule WorthMe.Statements.Transaction do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "statement_transactions" do
    field :occurred_on, :date
    field :occurred_at, :string
    field :narrative, :string
    field :debit, :decimal
    field :credit, :decimal
    field :balance, :decimal
    field :raw, :map

    belongs_to :statement, WorthMe.Statements.Statement

    timestamps()
  end

  def changeset(transaction, attrs) do
    transaction
    |> cast(attrs, [:occurred_on, :occurred_at, :narrative, :debit, :credit, :balance, :raw, :statement_id])
    |> validate_required([:statement_id])
  end
end

