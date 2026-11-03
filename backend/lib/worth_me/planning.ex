defmodule WorthMe.Planning do
  import Ecto.Query, warn: false
  alias WorthMe.Repo
  alias WorthMe.Planning.{RecurringExpense, FinancialGoal}

  def list_recurring_expenses(user_id) do
    RecurringExpense
    |> where([item], item.user_id == ^user_id)
    |> order_by([item], asc: item.due_day, asc: item.name)
    |> Repo.all()
  end

  def create_recurring_expense(user_id, attrs) do
    %RecurringExpense{user_id: user_id}
    |> RecurringExpense.changeset(attrs)
    |> Repo.insert()
  end

  def update_recurring_expense(user_id, id, attrs) do
    with %RecurringExpense{} = item <- Repo.get_by(RecurringExpense, id: id, user_id: user_id) do
      item |> RecurringExpense.changeset(attrs) |> Repo.update()
    else
      nil -> {:error, :not_found}
    end
  end

  def delete_recurring_expense(user_id, id) do
    with %RecurringExpense{} = item <- Repo.get_by(RecurringExpense, id: id, user_id: user_id) do
      Repo.delete(item)
    else
      nil -> {:error, :not_found}
    end
  end

  def list_financial_goals(user_id) do
    FinancialGoal
    |> where([item], item.user_id == ^user_id)
    |> order_by([item], asc: item.inserted_at)
    |> Repo.all()
  end

  def create_financial_goal(user_id, attrs) do
    %FinancialGoal{user_id: user_id}
    |> FinancialGoal.changeset(attrs)
    |> Repo.insert()
  end

  def update_financial_goal(user_id, id, attrs) do
    with %FinancialGoal{} = item <- Repo.get_by(FinancialGoal, id: id, user_id: user_id) do
      item |> FinancialGoal.changeset(attrs) |> Repo.update()
    else
      nil -> {:error, :not_found}
    end
  end

  def delete_financial_goal(user_id, id) do
    with %FinancialGoal{} = item <- Repo.get_by(FinancialGoal, id: id, user_id: user_id) do
      Repo.delete(item)
    else
      nil -> {:error, :not_found}
    end
  end
end
