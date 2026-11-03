defmodule WorthMeWeb.BalanceSnapshotController do
  use WorthMeWeb, :controller

  alias WorthMe.FinancialData

  @providers ["mpesa", "airtel", "im"]

  def index(conn, params) do
    case conn.assigns[:current_user] do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{success: false, error: "Not authenticated"})

      user ->
        days = parse_days(params["days"])

        json(conn, %{
          success: true,
          snapshots: FinancialData.list_balance_history(user.id, days)
        })
    end
  end

  def create(conn, %{"balances" => balances}) when is_map(balances) do
    case conn.assigns[:current_user] do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{success: false, error: "Not authenticated"})

      user ->
        balances = Map.take(balances, @providers)

        case FinancialData.record_balance_snapshots(user.id, balances) do
          {:ok, recorded} ->
            json(conn, %{success: true, recorded: length(recorded)})

          {:error, :invalid_balance} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{success: false, error: "Balances must be numeric"})

          {:error, reason} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{success: false, error: inspect(reason)})
        end
    end
  end

  def create(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{success: false, error: "balances must be an object"})
  end

  defp parse_days(nil), do: 90

  defp parse_days(value) do
    case Integer.parse(value) do
      {days, _} when days > 0 -> min(days, 365)
      _ -> 90
    end
  end
end
