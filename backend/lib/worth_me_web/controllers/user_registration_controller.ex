defmodule WorthMeWeb.UserRegistrationController do
  use WorthMeWeb, :controller

  alias WorthMe.Accounts
  alias WorthMe.Accounts.User
  alias WorthMeWeb.UserAuth
  alias WorthMeWeb.ErrorHelpers

  def new(conn, _params) do
    changeset = Accounts.change_user_registration(%User{})
    render(conn, :new, changeset: changeset)
  end

  def create(conn, %{"user" => user_params}) do
    case Accounts.register_user(user_params) do
      {:ok, user} ->
        case Phoenix.Controller.get_format(conn) do
          "json" ->
            conn
            |> put_status(:created)
            |> json(%{
              message: "User created successfully",
              user: %{
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone
              }
            })

        _ ->
          conn = UserAuth.log_in_user(conn, user, %{})
          if conn.state == :sent do
            conn
          else
            conn
            |> put_status(:created)
            |> json(%{
              message: "User created successfully",
              user: %{id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, phone: user.phone}
            })
          end
        end

      {:error, %Ecto.Changeset{} = changeset} ->
        case Phoenix.Controller.get_format(conn) do
          "json" ->
            errors = Ecto.Changeset.traverse_errors(changeset, &ErrorHelpers.translate_error/1)
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{errors: errors})

          _ ->
            conn
            |> put_status(:ok)
            |> put_flash(:error, "Oops, something went wrong! Please check the errors below.")
            |> render(:new, changeset: changeset)
        end
    end
  end
end
