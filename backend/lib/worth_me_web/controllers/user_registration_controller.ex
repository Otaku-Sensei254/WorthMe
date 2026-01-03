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
        conn
        |> put_status(:created)
        |> json(%{
          message: "User created successfully",
          user: %{id: user.id, email: user.email}
        })

      {:error, %Ecto.Changeset{} = changeset} ->
        errors = Ecto.Changeset.traverse_errors(changeset, &ErrorHelpers.translate_error/1)
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: errors})
    end
  end
end
