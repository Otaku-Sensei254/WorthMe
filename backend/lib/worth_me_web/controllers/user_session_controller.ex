defmodule WorthMeWeb.UserSessionController do
  use WorthMeWeb, :controller

  alias WorthMe.Accounts
  alias WorthMeWeb.UserAuth

  def new(conn, _params) do
    render(conn, :new, error_message: nil)
  end

  @doc """
  Handles User Login (Session Creation)
  """
  def create(conn, %{"user" => %{"email" => email, "password" => password} = user_params}) do
    if user = Accounts.get_user_by_email_and_password(email, password) do
      conn = UserAuth.log_in_user(conn, user, user_params)
      if conn.state == :sent do
        conn
      else
        if json_request?(conn) do
          conn
          |> put_status(:ok)
          |> json(%{
            message: "Logged in successfully",
            user: %{
              id: user.id,
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name,
              phone: user.phone
            }
          })
        else
          conn
          |> put_flash(:info, "Welcome back!")
          |> redirect(to: "/")
        end
      end
    else
      if json_request?(conn) do
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid email or password"})
      else
        conn
        |> put_flash(:error, "Invalid email or password")
        |> put_status(:unprocessable_entity)
        |> render(:new, error_message: "Invalid email or password")
      end
    end
  end

  @doc """
  Handles Logout
  """
  def delete(conn, _params) do
    case Phoenix.Controller.get_format(conn) do
      "json" ->
        conn = UserAuth.log_out_user(conn)
        if conn.state == :sent do
          conn
        else
          conn
          |> put_status(:ok)
          |> json(%{message: "Logged out successfully"})
        end

      _ ->
        conn = UserAuth.log_out_user(conn)
        if conn.state == :sent do
          conn
        else
          conn
          |> fetch_session()
          |> put_resp_header("location", "/users/log_in")
          |> send_resp(302, "")
        end
    end
  end

  defp json_request?(conn) do
    accept = conn |> get_req_header("accept") |> List.first("") |> String.downcase()
    content_type = conn |> get_req_header("content-type") |> List.first("") |> String.downcase()
    String.contains?(accept, "application/json") or String.contains?(content_type, "application/json")
  end
end
