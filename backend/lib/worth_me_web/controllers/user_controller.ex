defmodule WorthMeWeb.UserController do
  use WorthMeWeb, :controller

  # This endpoint only works if the user is logged in
def show(conn, _params) do
    case conn.assigns[:current_user] do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Not authenticated"})

      user ->
        json(conn, %{
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        })
    end
  end
end
