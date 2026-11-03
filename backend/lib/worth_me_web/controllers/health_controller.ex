defmodule WorthMeWeb.HealthController do
  use WorthMeWeb, :controller

  def index(conn, _params) do
    json(conn, %{status: "ok"})
  end
end
