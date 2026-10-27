defmodule WorthMe.FinancialData.Transaction do
  alias WorthMe.FinancialData.{FinancialAccount, StatementImport}
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "transactions" do
    field :occurred_on, :date
    field :occurred_at, :naive_datetime
    field :narrative, :string
    field :debit, :decimal, default: Decimal.new(0)
    field :credit, :decimal, default: Decimal.new(0)
    field :balance, :decimal
    field :type, :string
    field :category, :string
    field :provider_ref, :string
    field :raw, :map
    field :transfer_match_id, :binary_id

    belongs_to :account, FinancialAccount
    belongs_to :import, StatementImport

    timestamps()
  end

  def changeset(transaction, attrs) do
    transaction
    |> cast(attrs, [:account_id, :import_id, :occurred_on, :occurred_at, :narrative, :debit, :credit, :balance, :type, :category, :provider_ref, :raw, :transfer_match_id])
    |> validate_required([:account_id, :occurred_on])
    |> validate_inclusion(:type, ["debit", "credit", "transfer_in", "transfer_out", "fee", "interest", "unknown"])
  end
end
