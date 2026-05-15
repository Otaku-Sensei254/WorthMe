defmodule WorthMe.Statements.Statement do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "statements" do
    field :provider, :string
    field :statement_period, :string
    field :currency, :string
    field :balance, :decimal
    field :summary, :map
    field :meta, :map

    belongs_to :user, WorthMe.Accounts.User
    has_many :transactions, WorthMe.Statements.Transaction

    timestamps()
  end

  def changeset(statement, attrs) do
    statement
    |> cast(attrs, [:provider, :statement_period, :currency, :balance, :summary, :meta, :user_id])
    |> validate_required([:provider, :user_id])
    |> validate_length(:provider, min: 2, max: 32)
  end
end

