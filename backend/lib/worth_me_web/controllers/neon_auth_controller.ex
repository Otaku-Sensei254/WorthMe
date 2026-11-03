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

    with true <- is_binary(base_url) and base_url != "",
         {:ok, claims} <- verify_neon_token(base_url, token),
         {:ok, user} <- find_or_create_user(claims),
         conn <- UserAuth.log_in_user(conn, user) do
      conn
      |> put_status(:ok)
      |> json(%{
        message: "Logged in with Google",
        user: %{
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone
        }
      })
    else
      false ->
        conn
        |> put_status(:service_unavailable)
        |> json(%{error: "Neon Auth is not configured"})

      {:error, :invalid_token} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Google sign-in could not be verified"})

      {:error, :invalid_user} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Google did not return a verified email address"})

      {:error, _changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Could not create a WorthMe account"})
    end
  end

  def callback(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing token"})
  end

  defp verify_neon_token(base_url, token) when is_binary(token) and byte_size(token) < 16_384 do
    jwks_url = String.trim_trailing(base_url, "/") <> "/.well-known/jwks.json"
    client = Tesla.client([Tesla.Middleware.JSON])

    with {:ok, %{status: 200, body: %{"keys" => keys}}} when is_list(keys) <-
           Tesla.get(client, jwks_url),
         {:ok, claims} <- verify_signature(keys, token),
         true <- valid_claims?(claims, base_url) do
      {:ok, claims}
    else
      _ -> {:error, :invalid_token}
    end
  end

  defp verify_neon_token(_base_url, _token), do: {:error, :invalid_token}

  defp verify_signature(keys, token) do
    verified_claims =
      Enum.find_value(keys, fn key ->
        try do
          case JOSE.JWT.verify_strict(JOSE.JWK.from_map(key), ["EdDSA"], token) do
            {true, jwt, _jws} -> JOSE.JWT.to_map(jwt)
            _ -> nil
          end
        rescue
          _ -> nil
        end
      end)

    case verified_claims do
      claims when is_map(claims) -> {:ok, claims}
      _ -> {:error, :invalid_token}
    end
  end

  defp valid_claims?(claims, base_url) do
    issuer = auth_issuer(base_url)
    audience = claims["aud"]
    expires_at = claims["exp"]

    claims["iss"] == issuer and
      (audience == issuer or (is_list(audience) and issuer in audience)) and
      is_integer(expires_at) and expires_at > System.system_time(:second) and
      is_binary(claims["sub"]) and is_binary(claims["email"]) and
      claims["emailVerified"] == true
  end

  defp auth_issuer(base_url) do
    uri = URI.parse(base_url)
    port = if uri.port && uri.port not in [80, 443], do: ":#{uri.port}", else: ""
    "#{uri.scheme}://#{uri.host}#{port}"
  end

  defp find_or_create_user(user_info) do
    email = user_info["email"]

    case Accounts.get_user_by_email(email) do
      nil ->
        name_parts = String.split(user_info["name"] || "", " ", trim: true)

        first_name =
          user_info["given_name"] || List.first(name_parts) ||
            List.first(String.split(email, "@"))

        last_name = user_info["family_name"] || name_parts |> Enum.drop(1) |> Enum.join(" ")

        attrs = %{
          email: email,
          password: :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false),
          first_name: first_name,
          last_name: last_name
        }

        Accounts.register_oauth_user(attrs)

      user ->
        {:ok, user}
    end
  end
end
