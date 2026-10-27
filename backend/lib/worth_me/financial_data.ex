defmodule WorthMe.FinancialData do
  @moduledoc """
  The FinancialData context - handles accounts, imports, transactions, and net worth.
  """
  import Ecto.Query, warn: false
  alias WorthMe.Repo

  alias WorthMe.FinancialData.{
    FinancialInstitution,
    FinancialAccount,
    StatementImport,
    Transaction,
    BalanceSnapshot
  }

  # Institutions
  def list_institutions do
    Repo.all(FinancialInstitution)
  end

  def get_institution_by_code(code), do: Repo.get_by(FinancialInstitution, code: code)

  # Accounts
  def list_accounts(user_id) do
    FinancialAccount
    |> where([a], a.user_id == ^user_id)
    |> preload(:institution)
    |> Repo.all()
  end

  def get_account!(id), do: Repo.get!(FinancialAccount, id) |> Repo.preload([:institution, :user])

  def create_account(attrs) do
    %FinancialAccount{}
    |> FinancialAccount.changeset(attrs)
    |> Repo.insert()
  end

  # Imports
  def get_import!(id), do: Repo.get!(StatementImport, id)

  # Transactions
  def list_transactions(account_id, opts \\ []) do
    limit = Keyword.get(opts, :limit, 100)

    Transaction
    |> where([t], t.account_id == ^account_id)
    |> order_by([t], desc: t.occurred_on)
    |> limit(^limit)
    |> Repo.all()
  end

  # Net worth
  def get_latest_balances(user_id) do
    FinancialAccount
    |> where([a], a.user_id == ^user_id and a.status == "active")
    |> join(:left, [a], s in subquery(
      from bs in BalanceSnapshot,
        where: bs.account_id == parent_as(:a).id,
        order_by: [desc: bs.snapshot_at],
        limit: 1
    ), on: true, as: :latest_snapshot)
    |> preload([a, latest_snapshot: s], [:institution])
    |> Repo.all()
  end
end
