defmodule WorthMe.FinancialData.BalanceSnapshot do
  alias WorthMe.FinancialData.{FinancialAccount, StatementImport}
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "balance_snapshots" do
    field(:amount, :decimal)
    field(:currency, :string, default: "KES")
    field(:source, :string)
    field(:snapshot_at, :naive_datetime)

    belongs_to(:account, FinancialAccount)
    belongs_to(:import, StatementImport)

    timestamps()
  end

  def changeset(snapshot, attrs) do
    snapshot
    |> cast(attrs, [:account_id, :import_id, :amount, :currency, :source, :snapshot_at])
    |> validate_required([:account_id, :amount, :source, :snapshot_at])
    |> validate_inclusion(:source, ["statement", "api", "manual"])
  end
end
