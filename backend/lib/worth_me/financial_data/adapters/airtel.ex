defmodule WorthMe.FinancialData.Adapters.Airtel do
  @moduledoc """
  Airtel Money statement adapter.
  """
  @behaviour WorthMe.FinancialData.Adapter

  @impl true
  def fingerprint(binary) do
    :crypto.hash(:sha256, binary) |> Base.encode16(case: :lower)
  end

  @impl true
  def parse_statement(binary, _opts \\ []) do
    mp =
      Tesla.Multipart.new()
      |> Tesla.Multipart.add_file_content(binary, "statement.pdf", name: "statement")

    client = Tesla.client([{Tesla.Middleware.BaseUrl, "http://localhost:5000"}])

    case Tesla.post(client, "/api/parse/airtel", mp) do
      {:ok, %{status: 200, body: body}} when is_map(body) ->
        if body["success"] do
          {:ok, body}
        else
          {:error, body["error"] || "Parse failed"}
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
      debit = parse_decimal(tx["debit"])
      credit = parse_decimal(tx["credit"])

      %{
        occurred_on: nil,
        occurred_at: nil,
        narrative: tx["description"] || "",
        debit: debit || Decimal.new(0),
        credit: credit || Decimal.new(0),
        balance: parse_decimal(tx["balance"]),
        type: if(Decimal.gt?(debit || Decimal.new(0), Decimal.new(0)), do: "debit", else: if(Decimal.gt?(credit || Decimal.new(0), Decimal.new(0)), do: "credit", else: "unknown")),
        category: nil,
        provider_ref: tx["transactionId"],
        raw: tx
      }
    end)
  end

  @impl true
  def extract_summary(parsed) do
    summary = parsed["summary"] || %{}

    %{
      customer_name: summary["customerName"],
      mobile_number: summary["mobileNumber"],
      currency: "KES",
      statement_period: summary["statementPeriod"],
      request_date: summary["requestDate"],
      opening_balance: parse_decimal(summary["openingBalance"]),
      closing_balance: parse_decimal(summary["closingBalance"]),
      total_credit: parse_decimal(summary["totalCredit"]),
      total_debit: parse_decimal(summary["totalDebit"])
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
end
