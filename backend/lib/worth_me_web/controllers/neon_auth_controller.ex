defmodule WorthMeWeb.NeonAuthController do
  use WorthMeWeb, :controller

  alias WorthMe.Accounts
  alias WorthMeWeb.UserAuth

  def config(conn, _params) do
    base_url = Application.get_env(:worth_me, :neon_auth)[:base_url]

    json(conn, %{
      enabled: base_url != nil and base_url != "",
      base_url: base_url
    })
  end

  def callback(conn, %{"token" => token}) do
    base_url = Application.get_env(:worth_me, :neon_auth)[:base_url]

    if base_url == nil or base_url == "" do
      conn
      |> put_status(:service_unavailable)
      |> json(%{error: "Neon Auth not configured"})
    else
      case fetch_neon_user(base_url, token) do
        {:ok, user_info} ->
          email = user_info["email"] || user_info["user"] && user_info["user"]["email"]

          if email do
            case find_or_create_user(email, user_info) do
              {:ok, user} ->
                conn
                |> UserAuth.log_in_user(user)
                |> put_status(:ok)
                |> json(%{
                  message: "Logged in with Google",
                  user: %{id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name}
                })

              {:error, _changeset} ->
                conn
                |> put_status(:unprocessable_entity)
                |> json(%{error: "Failed to create user"})
            end
          else
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{error: "No email from Neon Auth"})
          end

        {:error, reason} ->
          conn
          |> put_status(:unauthorized)
          |> json(%{error: reason})
      end
    end
  end

  def callback(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing token"})
  end

  defp fetch_neon_user(base_url, token) do
    client = Tesla.client([
      {Tesla.Middleware.BaseUrl, base_url},
      Tesla.Middleware.JSON,
      {Tesla.Middleware.Headers, [{"authorization", "Bearer #{token}"}, {"content-type", "application/json"}]}
    ])

    case Tesla.get(client, "/session") do
      {:ok, %{status: 200, body: body}} when is_map(body) ->
        if body["user"] do
          {:ok, body["user"]}
        else
          {:ok, body}
        end

      {:ok, %{status: 200, body: body}} ->
        {:ok, body}

      {:ok, %{status: status}} ->
        {:error, "Neon Auth returned #{status}"}

      {:error, reason} ->
        {:error, "Failed to verify with Neon Auth: #{inspect(reason)}"}
    end
  end

  defp find_or_create_user(email, user_info) do
    case Accounts.get_user_by_email(email) do
      nil ->
        first_name = user_info["name"] || user_info["given_name"] || String.split(email, "@") |> List.first()
        last_name = user_info["family_name"] || ""

        attrs = %{
          email: email,
          password: :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false),
          first_name: first_name,
          last_name: last_name,
          phone: user_info["phone"] || "0000000000"
        }

        Accounts.register_user(attrs)

      user ->
        {:ok, user}
    end
  end
end
