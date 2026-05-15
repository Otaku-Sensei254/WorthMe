defmodule WorthMeWeb.MpesaController do
  use WorthMeWeb, :controller

  # Create a Tesla client with JSON middleware
  defp client do
    Tesla.client([
      {Tesla.Middleware.BaseUrl, "http://localhost:8080/api/mpesa"},
      Tesla.Middleware.JSON,
      {Tesla.Middleware.Headers, [{"content-type", "application/json"}]}
    ])
  end

  # 1. Trigger the sync
  def sync(conn, params) do
    # We can now accept a custom shortcode from the frontend
    payload = %{
      "short_code" => params["short_code"] || "174379",
      "phone_number" => params["phone_number"] || "254708374149"
    }

    case Tesla.post(client(), "/balance/request", payload) do
      {:ok, %{status: 200, body: body}} ->
        conn
        |> put_status(:ok)
        |> json(body)

      {:ok, %{status: status, body: body}} ->
        conn
        |> put_status(status)
        |> json(%{error: "Go Service returned error", details: body})

      {:error, reason} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Could not reach Go service", reason: inspect(reason)})
    end
  end

  # 2. Check status
  def status(conn, %{"conversation_id" => conv_id}) do
    case Tesla.get(client(), "/balance/status?conversation_id=" <> conv_id) do
      {:ok, %{status: 200, body: body}} ->
        conn
        |> put_status(:ok)
        |> json(body)

      {:error, _} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Failed to poll M-Pesa status"})
    end
  end
end
