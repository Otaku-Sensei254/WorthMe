defmodule WorthMe.Planning.FinancialGoal do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "financial_goals" do
    field :title, :string
    field :category, :string, default: "Personal"
    field :target_amount, :decimal
    field :saved_amount, :decimal, default: Decimal.new(0)
    field :horizon_months, :integer
    field :target_date, :date
    belongs_to :user, WorthMe.Accounts.User
    timestamps()
  end

  def changeset(goal, attrs) do
    goal
    |> cast(attrs, [
      :title,
      :category,
      :target_amount,
      :saved_amount,
      :horizon_months,
      :target_date
    ])
    |> validate_required([
      :title,
      :category,
      :target_amount,
      :saved_amount,
      :horizon_months,
      :target_date
    ])
    |> validate_length(:title, max: 100)
    |> validate_number(:target_amount, greater_than: 0)
    |> validate_number(:saved_amount, greater_than_or_equal_to: 0)
    |> validate_number(:horizon_months, greater_than_or_equal_to: 1, less_than_or_equal_to: 600)
    |> validate_saved_amount()
  end

  defp validate_saved_amount(changeset) do
    target = get_field(changeset, :target_amount)
    saved = get_field(changeset, :saved_amount)

    if target && saved && Decimal.compare(saved, target) == :gt do
      add_error(changeset, :saved_amount, "cannot exceed the goal amount")
    else
      changeset
    end
  end
end
