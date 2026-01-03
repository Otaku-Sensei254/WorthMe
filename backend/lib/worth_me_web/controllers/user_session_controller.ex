defmodule WorthMeWeb.UserSessionController do
  use WorthMeWeb, :controller

  alias WorthMe.Accounts
  alias WorthMeWeb.UserAuth

  @doc """
  Handles User Login (Session Creation)
  """
  def create(conn, %{"user" => %{"email" => email, "password" => password} = user_params}) do
    if user = Accounts.get_user_by_email_and_password(email, password) do
      # If using standard Phoenix Sessions (Cookies):
      # This sets the session cookie. Note: React needs 'credentials: include' to use this.
      conn
      |> UserAuth.log_in_user(user, user_params)
      |> put_status(:ok)
      |> json(%{
        message: "Logged in successfully",
        user: %{id: user.id, email: user.email}
      })
    else
      # 401 Unauthorized for failed login
      conn
      |> put_status(:unauthorized)
      |> json(%{error: "Invalid email or password"})
    end
  end

  @doc """
  Handles Logout
  """
  def delete(conn, _params) do
    conn
    |> UserAuth.log_out_user()
    |> put_status(:ok)
    |> json(%{message: "Logged out successfully"})
  end
end
