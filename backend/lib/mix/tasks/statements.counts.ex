defmodule Mix.Tasks.Statements.Counts do
  use Mix.Task

  @shortdoc "Print statement counts by provider"

  @moduledoc """
  Prints statement counts per provider and transaction totals using the configured Repo.

      mix statements.counts
  """

  import Ecto.Query, warn: false

  alias WorthMe.Repo
  alias WorthMe.Statements.Statement
  alias WorthMe.Statements.Transaction

  @impl true
  def run(_args) do
    Mix.Task.run("app.start")

    statement_counts =
      Statement
      |> group_by([s], s.provider)
      |> select([s], {s.provider, count(s.id)})
      |> order_by([s], asc: s.provider)
      |> Repo.all()

    tx_count = Repo.aggregate(Transaction, :count, :id)

    Mix.shell().info("Statements by provider:")

    Enum.each(statement_counts, fn {provider, count} ->
      Mix.shell().info("  #{provider}: #{count}")
    end)

    Mix.shell().info("Transactions total: #{tx_count}")
  end
end

