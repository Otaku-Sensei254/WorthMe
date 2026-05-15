defmodule WorthMe.Statements do
  @moduledoc """
  Persisted statement snapshots (provider + transactions) for a user.
  """

  import Ecto.Query, warn: false
  alias Ecto.Multi
  alias WorthMe.Repo

  alias WorthMe.Statements.Statement
  alias WorthMe.Statements.Transaction

  def create_statement_from_parsed(user, attrs) do
    provider = normalize_provider(attrs["provider"] || attrs[:provider])
    summary = attrs["summary"] || attrs[:summary] || %{}
    transactions = attrs["transactions"] || attrs[:transactions] || []

    statement_attrs =
      %{
        provider: provider,
        user_id: user.id,
        summary: summary,
        meta: attrs["meta"] || attrs[:meta] || %{}
      }
      |> Map.merge(best_effort_statement_fields(provider, summary))

    Multi.new()
    |> Multi.insert(:statement, Statement.changeset(%Statement{}, statement_attrs))
    |> Multi.run(:transactions, fn repo, %{statement: statement} ->
      tx_entries =
        transactions
        |> Enum.take(5000)
        |> Enum.map(&best_effort_transaction_attrs(provider, &1, statement.id))

      {count, _} = repo.insert_all(Transaction, tx_entries)
      {:ok, count}
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{statement: statement}} -> {:ok, statement}
      {:error, _step, reason, _changes} -> {:error, reason}
    end
  end

  def get_latest_statement_for_user(user, provider) do
    provider = normalize_provider(provider)

    Statement
    |> where([s], s.user_id == ^user.id and s.provider == ^provider)
    |> order_by([s], desc: s.inserted_at)
    |> preload([:transactions])
    |> limit(1)
    |> Repo.one()
  end

  defp normalize_provider(value) do
    value
    |> to_string()
    |> String.downcase()
    |> String.trim()
  end

  defp best_effort_statement_fields(provider, summary) when is_map(summary) do
    statement_period =
      summary["statementPeriod"] || summary["statement_period"] || summary["statementPeriod"] || summary["statementPeriod"]

    currency =
      summary["accountCurrency"] ||
        summary["currency"] ||
        summary["account_currency"] ||
        (provider in ["mpesa", "airtel"] && "KES") ||
        nil

    balance =
      summary["currentBalance"] ||
        summary["closingBalance"] ||
        summary["balanceAsOf"] ||
        summary["effectiveAvailableBalance"] ||
        summary["openingBalance"] ||
        nil

    %{
      statement_period: statement_period,
      currency: currency,
      balance: parse_decimal(balance)
    }
  end

  defp best_effort_statement_fields(_provider, _), do: %{}

  defp best_effort_transaction_attrs(provider, tx, statement_id) when is_map(tx) do
    occurred_on =
      case provider do
        "im" -> parse_date(tx["tranDate"] || tx[:tranDate])
        _ -> nil
      end

    credit =
      parse_decimal(
        tx["paidIn"] || tx[:paidIn] ||
          tx["credit"] || tx[:credit] ||
          tx["deposits"] || tx[:deposits]
      )

    debit =
      parse_decimal(
        tx["withdrawn"] || tx[:withdrawn] ||
          tx["debit"] || tx[:debit] ||
          tx["withdrawals"] || tx[:withdrawals]
      )

    balance =
      parse_decimal(tx["balance"] || tx[:balance])

    narrative =
      tx["details"] || tx[:details] ||
        tx["description"] || tx[:description] ||
        tx["transactionNarrative"] || tx[:transactionNarrative] ||
        nil

    %{
      statement_id: statement_id,
      occurred_on: occurred_on,
      occurred_at: to_string(tx["completionTime"] || tx[:completionTime] || tx["transactionDate"] || tx[:transactionDate] || tx["tranDate"] || tx[:tranDate] || ""),
      narrative: narrative && to_string(narrative),
      debit: debit,
      credit: credit,
      balance: balance,
      raw: tx,
      inserted_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second),
      updated_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
    }
  end

  defp best_effort_transaction_attrs(_provider, tx, statement_id) do
    %{
      statement_id: statement_id,
      raw: %{"value" => tx},
      inserted_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second),
      updated_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
    }
  end

  defp parse_decimal(nil), do: nil

  defp parse_decimal(value) when is_binary(value) do
    cleaned = value |> String.replace(~r/[^0-9.-]/, "")
    case Decimal.parse(cleaned) do
      {dec, _} -> dec
      :error -> nil
    end
  end

  defp parse_decimal(value) when is_number(value), do: Decimal.from_float(value * 1.0)
  defp parse_decimal(%Decimal{} = value), do: value
  defp parse_decimal(_), do: nil

  defp parse_date(nil), do: nil
  defp parse_date(value) when is_binary(value) do
    case String.split(value, "-", parts: 3) do
      [dd, mm, yyyy] ->
        with {d, ""} <- Integer.parse(dd),
             {m, ""} <- Integer.parse(mm),
             {y, ""} <- Integer.parse(yyyy),
             {:ok, date} <- Date.new(y, m, d) do
          date
        else
          _ -> nil
        end

      _ ->
        nil
    end
  end

  defp parse_date(_), do: nil
end

