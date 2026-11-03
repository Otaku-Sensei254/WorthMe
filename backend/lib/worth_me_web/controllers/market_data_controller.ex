defmodule WorthMeWeb.MarketDataController do
  use WorthMeWeb, :controller

  def index(conn, _params) do
    fx = fetch_fx_rates()
    stocks = mock_stocks()
    yields = mock_yields()

    json(conn, %{
      stocks: stocks,
      fxRates: fx,
      yields: yields,
      lastUpdated: DateTime.utc_now() |> DateTime.to_iso8601()
    })
  end

  defp fetch_fx_rates do
    usd_rates =
      case Tesla.get("https://open.er-api.com/v6/latest/USD") do
        {:ok, %{status: 200, body: body}} ->
          case Jason.decode(body) do
            {:ok, %{"rates" => rates}} -> rates
            _ -> %{}
          end

        _ -> %{}
      end

    Enum.map([{"USD", "KES"}, {"GBP", "KES"}, {"EUR", "KES"}], fn {base, quote} ->
      rate =
        if base == "USD" do
          case usd_rates[quote] do
            r when is_number(r) -> :erlang.float_to_binary(r, decimals: 3)
            _ -> "0.000"
          end
        else
          case {usd_rates[base], usd_rates[quote]} do
            {b, q} when is_number(b) and is_number(q) -> :erlang.float_to_binary(q / b, decimals: 3)
            _ -> "0.000"
          end
        end

      %{pair: "#{base} / #{quote}", rate: rate, change: "+0.00%", isPositive: true}
    end)
  end

  defp mock_stocks do
    [
      %{ticker: "SCOM", name: "Safaricom PLC", price: "17.40", change: "+1.75%", isPositive: true},
      %{ticker: "EQTY", name: "Equity Group Holdings", price: "43.50", change: "+0.80%", isPositive: true},
      %{ticker: "KCB", name: "KCB Group PLC", price: "34.15", change: "-0.45%", isPositive: false}
    ]
  end

  defp mock_yields do
    [
      %{term: "91-Day Treasury Bill", rate: "15.75%"},
      %{term: "182-Day Treasury Bill", rate: "16.45%"},
      %{term: "364-Day Treasury Bill", rate: "16.85%"}
    ]
  end
end
