defmodule WorthMeWeb.StatementController do
  use WorthMeWeb, :controller

  alias WorthMe.Statements

  def create(conn, params) do
    case conn.assigns[:current_user] do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{success: false, error: "Not authenticated"})

      user ->
        case Statements.create_statement_from_parsed(user, params) do
          {:ok, statement} ->
            json(conn, %{
              success: true,
              statement_id: statement.id,
              provider: statement.provider
            })

          {:error, reason} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{success: false, error: inspect(reason)})
        end
    end
  end

  def latest(conn, %{"provider" => provider}) do
    case conn.assigns[:current_user] do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{success: false, error: "Not authenticated"})

      user ->
        statement = Statements.get_latest_statement_for_user(user, provider)

        if statement do
          json(conn, %{
            success: true,
            provider: statement.provider,
            summary: statement.summary || %{},
            transactions: Enum.map(statement.transactions || [], &(&1.raw || %{})),
            saved_at: statement.inserted_at
          })
        else
          json(conn, %{success: true, provider: provider, summary: nil, transactions: []})
        end
    end
  end

  def latest(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{success: false, error: "provider is required"})
  end
end

