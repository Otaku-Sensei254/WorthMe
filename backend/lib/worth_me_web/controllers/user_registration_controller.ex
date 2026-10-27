defmodule WorthMeWeb.UserRegistrationController do
  use WorthMeWeb, :controller

  alias WorthMe.Accounts
  alias WorthMe.Accounts.User
  alias WorthMeWeb.UserAuth

  def new(conn, _params) do
    changeset = Accounts.change_user_registration(%User{})
    render(conn, :new, changeset: changeset)
  end

  def create(conn, %{"user" => user_params}) do
    case Accounts.register_user(user_params) do
      {:ok, user} ->
        conn
        |> put_flash(:info, "Account created successfully.")
        |> UserAuth.log_in_user(user)
        |> redirect(to: "/")

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:ok)
        |> render(:new, changeset: changeset)
    end
  end
end
