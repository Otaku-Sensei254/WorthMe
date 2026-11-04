defmodule WorthMeWeb.UserController do
  use WorthMeWeb, :controller

  alias WorthMe.Accounts

  def update_phone(conn, %{"phone" => phone}) do
    case conn.assigns[:current_user] do
      nil ->
        conn |> put_status(:unauthorized) |> json(%{error: "Not authenticated"})

      user ->
        case Accounts.update_user_phone(user, phone) do
          {:ok, updated_user} ->
            json(conn, %{
              id: updated_user.id,
              email: updated_user.email,
              first_name: updated_user.first_name,
              last_name: updated_user.last_name,
              phone: updated_user.phone
            })

          {:error, changeset} ->
            errors = Ecto.Changeset.traverse_errors(changeset, fn {message, _opts} -> message end)
            conn |> put_status(:unprocessable_entity) |> json(%{errors: errors})
        end
    end
  end

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
          last_name: user.last_name,
          phone: user.phone
        })
    end
  end
end
