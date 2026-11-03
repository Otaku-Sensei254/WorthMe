defmodule WorthMeWeb.PlanningController do
  use WorthMeWeb, :controller

  alias WorthMe.Planning
  alias Ecto.Changeset

  def index(conn, %{"resource" => "recurring"}) do
    with_user(conn, fn user ->
      json(conn, %{
        success: true,
        items: Enum.map(Planning.list_recurring_expenses(user.id), &recurring_json/1)
      })
    end)
  end

  def index(conn, %{"resource" => "goals"}) do
    with_user(conn, fn user ->
      json(conn, %{
        success: true,
        items: Enum.map(Planning.list_financial_goals(user.id), &goal_json/1)
      })
    end)
  end

  def create(conn, %{"resource" => "recurring", "item" => attrs}) do
    with_user(conn, fn user ->
      case Planning.create_recurring_expense(user.id, attrs) do
        {:ok, item} ->
          conn |> put_status(:created) |> json(%{success: true, item: recurring_json(item)})

        {:error, changeset} ->
          validation_error(conn, changeset)
      end
    end)
  end

  def create(conn, %{"resource" => "goals", "item" => attrs}) do
    with_user(conn, fn user ->
      case Planning.create_financial_goal(user.id, attrs) do
        {:ok, item} ->
          conn |> put_status(:created) |> json(%{success: true, item: goal_json(item)})

        {:error, changeset} ->
          validation_error(conn, changeset)
      end
    end)
  end

  def update(conn, %{"resource" => "recurring", "id" => id, "item" => attrs}) do
    with_user(conn, fn user ->
      case Planning.update_recurring_expense(user.id, id, attrs) do
        {:ok, item} -> json(conn, %{success: true, item: recurring_json(item)})
        {:error, :not_found} -> not_found(conn)
        {:error, changeset} -> validation_error(conn, changeset)
      end
    end)
  end

  def update(conn, %{"resource" => "goals", "id" => id, "item" => attrs}) do
    with_user(conn, fn user ->
      case Planning.update_financial_goal(user.id, id, attrs) do
        {:ok, item} -> json(conn, %{success: true, item: goal_json(item)})
        {:error, :not_found} -> not_found(conn)
        {:error, changeset} -> validation_error(conn, changeset)
      end
    end)
  end

  def delete(conn, %{"resource" => "recurring", "id" => id}) do
    with_user(conn, fn user ->
      delete_result(conn, Planning.delete_recurring_expense(user.id, id))
    end)
  end

  def delete(conn, %{"resource" => "goals", "id" => id}) do
    with_user(conn, fn user ->
      delete_result(conn, Planning.delete_financial_goal(user.id, id))
    end)
  end

  defp with_user(conn, callback) do
    case conn.assigns[:current_user] do
      nil ->
        conn |> put_status(:unauthorized) |> json(%{success: false, error: "Not authenticated"})

      user ->
        callback.(user)
    end
  end

  defp delete_result(conn, {:ok, _item}), do: json(conn, %{success: true})
  defp delete_result(conn, {:error, :not_found}), do: not_found(conn)

  defp not_found(conn) do
    conn |> put_status(:not_found) |> json(%{success: false, error: "Item not found"})
  end

  defp validation_error(conn, changeset) do
    errors = Changeset.traverse_errors(changeset, fn {message, _opts} -> message end)
    conn |> put_status(:unprocessable_entity) |> json(%{success: false, errors: errors})
  end

  defp recurring_json(item) do
    %{
      id: item.id,
      name: item.name,
      category: item.category,
      amount: item.amount,
      frequency: item.frequency,
      due_day: item.due_day,
      due_month: item.due_month,
      due_weekday: item.due_weekday,
      active: item.active
    }
  end

  defp goal_json(item) do
    %{
      id: item.id,
      title: item.title,
      category: item.category,
      target_amount: item.target_amount,
      saved_amount: item.saved_amount,
      horizon_months: item.horizon_months,
      target_date: item.target_date
    }
  end
end
