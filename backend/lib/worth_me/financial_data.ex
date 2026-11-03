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
    |> join(
      :left,
      [a],
      s in subquery(
        from bs in BalanceSnapshot,
          where: bs.account_id == parent_as(:a).id,
          order_by: [desc: bs.snapshot_at],
          limit: 1
      ), on: true, as: :latest_snapshot)
    |> preload([a, latest_snapshot: s], [:institution])
    |> Repo.all()
  end

  @snapshot_providers %{
    "mpesa" => {"M-Pesa Wallet", "wallet"},
    "airtel" => {"Airtel Money Wallet", "wallet"},
    "im" => {"I&M Bank Account", "checking"}
  }

  def record_balance_snapshots(user_id, balances) when is_map(balances) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
    start_of_day = NaiveDateTime.new!(NaiveDateTime.to_date(now), ~T[00:00:00])
    end_of_day = NaiveDateTime.add(start_of_day, 86_400, :second)

    balances
    |> Enum.reduce_while({:ok, []}, fn {provider, amount}, {:ok, recorded} ->
      provider = to_string(provider)

      case Map.fetch(@snapshot_providers, provider) do
        :error ->
          {:cont, {:ok, recorded}}

        {:ok, {account_name, account_type}} ->
          with {:ok, amount} <- snapshot_amount(amount),
               {:ok, account} <-
                 get_or_create_snapshot_account(user_id, provider, account_name, account_type),
               {:ok, snapshot} <-
                 upsert_daily_snapshot(account, amount, start_of_day, end_of_day, now) do
            {:cont, {:ok, [snapshot | recorded]}}
          else
            {:error, reason} -> {:halt, {:error, reason}}
          end
      end
    end)
  end

  def record_balance_snapshots(_user_id, _balances), do: {:error, :invalid_balances}

  def list_balance_history(user_id, days \\ 90) do
    since = NaiveDateTime.add(NaiveDateTime.utc_now(), -days * 86_400, :second)

    rows =
      from(snapshot in BalanceSnapshot,
        join: account in assoc(snapshot, :account),
        join: institution in assoc(account, :institution),
        where: account.user_id == ^user_id and snapshot.snapshot_at >= ^since,
        order_by: [desc: snapshot.snapshot_at, desc: snapshot.inserted_at],
        select: {snapshot.snapshot_at, snapshot.amount, institution.code}
      )
      |> Repo.all()

    rows
    |> Enum.reduce(%{}, fn {snapshot_at, amount, provider}, history ->
      date = snapshot_at |> NaiveDateTime.to_date() |> Date.to_iso8601()

      Map.update(history, date, %{provider => amount}, fn day ->
        # Rows are newest first; retain the latest balance for each provider/day.
        Map.put_new(day, provider, amount)
      end)
    end)
    |> Enum.map(fn {date, balances} ->
      total = balances |> Map.values() |> Enum.reduce(Decimal.new(0), &Decimal.add/2)

      %{
        date: date,
        total: Decimal.to_string(total, :normal),
        balances:
          Map.new(balances, fn {provider, amount} ->
            {provider, Decimal.to_string(amount, :normal)}
          end)
      }
    end)
    |> Enum.sort_by(& &1.date)
  end

  defp snapshot_amount(%Decimal{} = amount), do: {:ok, amount}
  defp snapshot_amount(amount) when is_integer(amount), do: {:ok, Decimal.new(amount)}
  defp snapshot_amount(amount) when is_float(amount), do: {:ok, Decimal.from_float(amount)}

  defp snapshot_amount(amount) when is_binary(amount) do
    case Decimal.parse(String.replace(amount, ",", "")) do
      {decimal, ""} -> {:ok, decimal}
      _ -> {:error, :invalid_balance}
    end
  end

  defp snapshot_amount(_amount), do: {:error, :invalid_balance}

  defp get_or_create_snapshot_account(user_id, provider, account_name, account_type) do
    institution = Repo.get_by(FinancialInstitution, code: provider)

    if institution do
      account =
        FinancialAccount
        |> where([a], a.user_id == ^user_id and a.institution_id == ^institution.id)
        |> order_by([a], desc: a.inserted_at)
        |> limit(1)
        |> Repo.one()

      case account do
        nil ->
          create_account(%{
            user_id: user_id,
            institution_id: institution.id,
            account_type: account_type,
            name: account_name,
            currency: "KES",
            status: "active",
            metadata: %{provider: provider, source: "dashboard_snapshot"}
          })

        account ->
          {:ok, account}
      end
    else
      {:error, :institution_not_found}
    end
  end

  defp upsert_daily_snapshot(account, amount, start_of_day, end_of_day, now) do
    existing =
      BalanceSnapshot
      |> where(
        [s],
        s.account_id == ^account.id and s.snapshot_at >= ^start_of_day and
          s.snapshot_at < ^end_of_day
      )
      |> order_by([s], desc: s.snapshot_at)
      |> limit(1)
      |> Repo.one()

    case existing do
      nil ->
        %BalanceSnapshot{}
        |> BalanceSnapshot.changeset(%{
          account_id: account.id,
          amount: amount,
          currency: "KES",
          source: "api",
          snapshot_at: now
        })
        |> Repo.insert()

      snapshot ->
        snapshot
        |> BalanceSnapshot.changeset(%{amount: amount, source: "api", snapshot_at: now})
        |> Repo.update()
    end
  end
end
