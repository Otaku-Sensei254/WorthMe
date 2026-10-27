defmodule WorthMe.FinancialData.Adapter do
  @moduledoc """
  Behaviour for financial statement parsers.
  
  Each provider adapter must implement these callbacks to normalize
  provider-specific statement formats into the canonical schema.
  """

  @callback parse_statement(binary(), keyword()) ::
              {:ok, parsed :: map()} | {:error, reason :: term()}

  @callback normalize_transactions(parsed :: map()) :: [map()]

  @callback extract_summary(parsed :: map()) :: map()

  @callback fingerprint(binary()) :: String.t()
end
