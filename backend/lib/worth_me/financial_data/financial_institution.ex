defmodule WorthMe.FinancialData.FinancialInstitution do
  alias WorthMe.FinancialData.FinancialAccount
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "financial_institutions" do
    field :code, :string
    field :name, :string
    field :type, :string
    field :country, :string, default: "KE"
    field :currency, :string, default: "KES"
    field :config, :map, default: %{}

    has_many :financial_accounts, FinancialAccount

    timestamps()
  end

  def changeset(institution, attrs) do
    institution
    |> cast(attrs, [:code, :name, :type, :country, :currency, :config])
    |> validate_required([:code, :name, :type])
    |> unique_constraint(:code)
  end
end
