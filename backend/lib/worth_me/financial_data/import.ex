defmodule WorthMe.FinancialData.Import do
  @moduledoc """
  Handles statement import pipeline: deduplication, parsing, normalization, persistence.
  """
  import Ecto.Query, warn: false
  alias WorthMe.Repo
  alias WorthMe.FinancialData
  alias WorthMe.FinancialData.{FinancialAccount, StatementImport, Transaction, BalanceSnapshot}
  alias WorthMe.FinancialData.Adapters

  def import(account_id, pdf_bytes, opts \\ []) do
    account = FinancialAccount |> Repo.get!(account_id) |> Repo.preload([:institution, :user])
    adapter = Adapters.get(account.institution.code)
    password = Keyword.get(opts, :password, "")
    fingerprint = adapter.fingerprint(pdf_bytes)

    # Check for duplicate import
    if Repo.get_by(StatementImport, account_id: account_id, file_hash: fingerprint) do
      {:error, :duplicate_import}
    else
      with {:ok, import} <- create_import(account, fingerprint),
           {:ok, parsed} <- adapter.parse_statement(pdf_bytes, password: password),
           {:ok, normalized_txns} <- normalize_and_persist(import, adapter, parsed, account) do
        {:ok, import |> Repo.reload() |> Repo.preload([:transactions, :balance_snapshots])}
      else
        {:error, reason} = error ->
          # Mark import as failed if it was created
          mark_failed_if_exists(account_id, fingerprint, reason)
          error
      end
    end
  end

  defp create_import(account, fingerprint) do
    %StatementImport{}
    |> StatementImport.changeset(%{
      account_id: account.id,
      user_id: account.user_id,
      provider: account.institution.code,
      source: "pdf_upload",
      file_hash: fingerprint,
      status: "processing"
    })
    |> Repo.insert()
  end

  defp normalize_and_persist(import, adapter, parsed, account) do
    summary = adapter.extract_summary(parsed)
    txns = adapter.normalize_transactions(parsed)

    Repo.transaction(fn ->
      # Update import with summary
      import
      |> StatementImport.changeset(%{
        summary: summary,
        statement_period: summary[:statement_period] || summary["statement_period"],
        transaction_count: length(txns),
        status: "completed",
        completed_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
      })
      |> Repo.update!()

      # Persist transactions
      now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

      tx_entries =
        Enum.map(txns, fn txn ->
          Map.merge(txn, %{
            id: Ecto.UUID.generate(),
            account_id: account.id,
            import_id: import.id,
            inserted_at: now,
            updated_at: now
          })
        end)

      if tx_entries != [] do
        Repo.insert_all(Transaction, tx_entries)
      end

      # Create balance snapshot if balance exists
      balance =
        summary[:balance_as_of] || summary[:current_balance] || summary[:closing_balance] ||
          summary["balance_as_of"] || summary["current_balance"] || summary["closing_balance"]

      if balance do
        %BalanceSnapshot{}
        |> BalanceSnapshot.changeset(%{
          account_id: account.id,
          import_id: import.id,
          amount: balance,
          currency: summary[:currency] || "KES",
          source: "statement",
          snapshot_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
        })
        |> Repo.insert!()
      end

      %{import: import, transactions: length(tx_entries)}
    end)
  end

  defp mark_failed_if_exists(account_id, fingerprint, reason) do
    case Repo.get_by(StatementImport, account_id: account_id, file_hash: fingerprint) do
      nil ->
        :ok

      import ->
        import
        |> StatementImport.changeset(%{status: "failed", error: %{message: inspect(reason)}})
        |> Repo.update()
    end
  end
end
