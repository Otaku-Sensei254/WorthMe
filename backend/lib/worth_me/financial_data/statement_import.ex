defmodule WorthMe.FinancialData.StatementImport do
  alias WorthMe.FinancialData.FinancialAccount
  alias WorthMe.Accounts.User
  alias WorthMe.FinancialData.{Transaction, BalanceSnapshot}
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "statement_imports" do
    field(:provider, :string)
    field(:source, :string)
    field(:file_hash, :string)
    field(:statement_period, :string)
    field(:status, :string, default: "pending")
    field(:summary, :map)
    field(:error, :map)
    field(:transaction_count, :integer, default: 0)
    field(:completed_at, :naive_datetime)

    belongs_to(:account, FinancialAccount)
    belongs_to(:user, User)
    has_many(:transactions, Transaction)
    has_many(:balance_snapshots, BalanceSnapshot)

    timestamps()
  end

  def changeset(import, attrs) do
    import
    |> cast(attrs, [
      :account_id,
      :user_id,
      :provider,
      :source,
      :file_hash,
      :statement_period,
      :status,
      :summary,
      :error,
      :transaction_count,
      :completed_at
    ])
    |> validate_required([:account_id, :user_id, :provider, :source])
    |> validate_inclusion(:status, ["pending", "processing", "completed", "failed", "partial"])
    |> validate_inclusion(:source, ["pdf_upload", "api_sync", "manual"])
  end
end
