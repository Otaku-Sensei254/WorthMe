defmodule WorthMeWeb.PageController do
  use WorthMeWeb, :controller

  def home(conn, _params) do
    redirect(conn, to: ~p"/users/log_in")
  end
end
