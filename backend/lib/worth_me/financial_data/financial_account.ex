defmodule WorthMe.FinancialData.FinancialAccount do
  use Ecto.Schema
  import Ecto.Changeset
  alias WorthMe.Accounts.User

  alias WorthMe.FinancialData.{
    FinancialInstitution,
    StatementImport,
    Transaction,
    BalanceSnapshot
  }

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "financial_accounts" do
    field(:account_type, :string)
    field(:name, :string)
    field(:currency, :string, default: "KES")
    field(:status, :string, default: "active")
    field(:metadata, :map, default: %{})

    belongs_to(:user, User)
    belongs_to(:institution, FinancialInstitution)
    has_many(:statement_imports, StatementImport)
    has_many(:transactions, Transaction)
    has_many(:balance_snapshots, BalanceSnapshot)

    timestamps()
  end

  def changeset(account, attrs) do
    account
    |> cast(attrs, [
      :user_id,
      :institution_id,
      :account_type,
      :name,
      :currency,
      :status,
      :metadata
    ])
    |> validate_required([:user_id, :institution_id, :account_type, :name])
    |> validate_inclusion(:account_type, [
      "wallet",
      "checking",
      "savings",
      "loan",
      "credit",
      "investment",
      "cash",
      "asset"
    ])
    |> validate_inclusion(:status, ["active", "closed", "archived"])
  end
end
