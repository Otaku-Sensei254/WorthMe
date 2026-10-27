defmodule WorthMe.FinancialData.Adapters.ImBank do
  @moduledoc """
  I&M Bank statement adapter.
  Calls the existing Node.js parser service and normalizes to canonical format.
  """
  @behaviour WorthMe.FinancialData.Adapter

  @impl true
  def fingerprint(binary) do
    :crypto.hash(:sha256, binary) |> Base.encode16(case: :lower)
  end

  @impl true
  def parse_statement(binary, opts \\ []) do
    password = Keyword.get(opts, :password, "")

    mp =
      Tesla.Multipart.new()
      |> Tesla.Multipart.add_file_content(binary, "statement.pdf", name: "statement")
      |> Tesla.Multipart.add_field("password", password)

    client = Tesla.client([{Tesla.Middleware.BaseUrl, "http://localhost:5000"}])

    case Tesla.post(client, "/api/parse/im", mp) do
      {:ok, %{status: 200, body: body}} when is_map(body) ->
        if body["success"] do
          {:ok, body}
        else
          {:error, body["message"] || body["error"] || "Parse failed"}
        end

      {:ok, %{status: status, body: body}} ->
        {:error, "Parser returned status #{status}: #{inspect(body)}"}

      {:error, reason} ->
        {:error, "Failed to reach parser service: #{inspect(reason)}"}
    end
  end

  @impl true
  def normalize_transactions(parsed) do
    transactions = parsed["transactions"] || []

    Enum.map(transactions, fn tx ->
      debit = parse_decimal(tx["withdrawals"])
      credit = parse_decimal(tx["deposits"])

      %{
        occurred_on: parse_date(tx["tranDate"]),
        occurred_at: nil,
        narrative: tx["transactionNarrative"] || "",
        debit: debit || Decimal.new(0),
        credit: credit || Decimal.new(0),
        balance: parse_decimal(tx["balance"]),
        type: if(Decimal.gt?(debit || Decimal.new(0), Decimal.new(0)), do: "debit", else: if(Decimal.gt?(credit || Decimal.new(0), Decimal.new(0)), do: "credit", else: "unknown")),
        category: nil,
        provider_ref: tx["refNo"],
        raw: tx
      }
    end)
  end

  @impl true
  def extract_summary(parsed) do
    summary = parsed["summary"] || %{}

    %{
      account_name: summary["accountName"],
      account_number: summary["accountNumber"],
      account_type: summary["accountType"],
      currency: summary["accountCurrency"] || "KES",
      statement_period: summary["statementPeriod"],
      opening_balance: parse_decimal(summary["openingBalance"]),
      total_deposits: parse_decimal(summary["totalDeposits"]),
      total_withdrawals: parse_decimal(summary["totalWithdrawals"]),
      balance_as_of: parse_decimal(summary["balanceAsOf"]),
      balance_as_of_date: summary["balanceAsOfDate"],
      cleared_balance: parse_decimal(summary["clearedBalance"]),
      effective_available_balance: parse_decimal(summary["effectiveAvailableBalance"])
    }
  end

  defp parse_decimal(nil), do: nil

  defp parse_decimal(value) when is_binary(value) do
    cleaned = String.replace(value, ~r/[^\d.-]/, "")
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
