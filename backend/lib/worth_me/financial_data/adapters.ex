defmodule WorthMe.FinancialData.Adapters do
  @moduledoc """
  Registry for financial data adapters.
  """

  alias WorthMe.FinancialData.Adapters.{Mpesa, Airtel, ImBank}

  def get("mpesa"), do: Mpesa
  def get("airtel"), do: Airtel
  def get("im"), do: ImBank
  def get(_), do: {:error, :unknown_provider}
end
