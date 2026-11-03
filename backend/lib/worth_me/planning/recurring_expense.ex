defmodule WorthMe.Planning.RecurringExpense do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "recurring_expenses" do
    field :name, :string
    field :category, :string
    field :amount, :decimal
    field :frequency, :string, default: "monthly"
    field :due_day, :integer
    field :due_month, :integer
    field :due_weekday, :integer
    field :active, :boolean, default: true
    belongs_to :user, WorthMe.Accounts.User
    timestamps()
  end

  def changeset(expense, attrs) do
    expense
    |> cast(attrs, [
      :name,
      :category,
      :amount,
      :frequency,
      :due_day,
      :due_month,
      :due_weekday,
      :active
    ])
    |> validate_required([:name, :category, :amount, :frequency])
    |> validate_length(:name, max: 100)
    |> validate_length(:category, max: 40)
    |> validate_number(:amount, greater_than: 0)
    |> validate_inclusion(:frequency, ["daily", "weekly", "monthly", "yearly"])
    |> validate_schedule_fields()
  end

  defp validate_schedule_fields(changeset) do
    case get_field(changeset, :frequency) do
      "daily" ->
        changeset
        |> put_change(:due_day, nil)
        |> put_change(:due_month, nil)
        |> put_change(:due_weekday, nil)

      "weekly" ->
        changeset
        |> validate_required([:due_weekday])
        |> validate_number(:due_weekday, greater_than_or_equal_to: 0, less_than_or_equal_to: 6)
        |> put_change(:due_day, nil)
        |> put_change(:due_month, nil)

      "monthly" ->
        changeset
        |> validate_required([:due_day])
        |> validate_number(:due_day, greater_than_or_equal_to: 1, less_than_or_equal_to: 31)
        |> put_change(:due_month, nil)
        |> put_change(:due_weekday, nil)

      "yearly" ->
        changeset
        |> validate_required([:due_month, :due_day])
        |> validate_number(:due_month, greater_than_or_equal_to: 1, less_than_or_equal_to: 12)
        |> validate_number(:due_day, greater_than_or_equal_to: 1, less_than_or_equal_to: 31)
        |> validate_yearly_date()
        |> put_change(:due_weekday, nil)

      _ ->
        changeset
    end
  end

  defp validate_yearly_date(changeset) do
    month = get_field(changeset, :due_month)
    day = get_field(changeset, :due_day)

    if is_integer(month) and month in 1..12 and is_integer(day) and day in 1..31 do
      case Date.new(2024, month, day) do
        {:ok, _date} -> changeset
        {:error, _reason} -> add_error(changeset, :due_day, "is not valid for the selected month")
      end
    else
      changeset
    end
  end
end
