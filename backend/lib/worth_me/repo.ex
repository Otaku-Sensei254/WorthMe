defmodule WorthMe.Repo do
  use Ecto.Repo,
    otp_app: :worth_me,
    adapter: Ecto.Adapters.Postgres
end
