defmodule WorthMeWeb.PageController do
  use WorthMeWeb, :controller

  def home(conn, _params) do
    conn
    |> put_resp_content_type("text/html")
    |> send_resp(200, "<html><body><script>window.location.href='http://localhost:3000/';</script></body></html>")
  end
end
