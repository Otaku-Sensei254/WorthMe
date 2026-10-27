defmodule WorthMe.Repo.Migrations.AddCanonicalFinancialSchema do
  use Ecto.Migration

  def up do
    # 1. Financial institutions (reference data)
    create table(:financial_institutions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :code, :string, null: false
      add :name, :string, null: false
      add :type, :string, null: false
      add :country, :string, default: "KE"
      add :currency, :string, default: "KES"
      add :config, :map, default: %{}
      timestamps()
    end
    create unique_index(:financial_institutions, [:code])

    # Seed initial institutions
    execute("""
      INSERT INTO financial_institutions (id, code, name, type, country, currency, config, inserted_at, updated_at)
      VALUES
        (gen_random_uuid(), 'mpesa', 'M-Pesa', 'mobile_money', 'KE', 'KES', '{}', now(), now()),
        (gen_random_uuid(), 'airtel', 'Airtel Money', 'mobile_money', 'KE', 'KES', '{}', now(), now()),
        (gen_random_uuid(), 'im', 'I&M Bank', 'bank', 'KE', 'KES', '{}', now(), now()),
        (gen_random_uuid(), 'kcb', 'KCB Bank', 'bank', 'KE', 'KES', '{}', now(), now()),
        (gen_random_uuid(), 'equity', 'Equity Bank', 'bank', 'KE', 'KES', '{}', now(), now()),
        (gen_random_uuid(), 'coop', 'Co-op Bank', 'bank', 'KE', 'KES', '{}', now(), now())
      ON CONFLICT (code) DO NOTHING;
    """)

    # 2. Financial accounts (user's accounts)
    create table(:financial_accounts, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :institution_id, references(:financial_institutions, type: :binary_id, on_delete: :nilify_all)
      add :account_type, :string, null: false
      add :name, :string, null: false
      add :currency, :string, default: "KES"
      add :status, :string, default: "active"
      add :metadata, :map, default: %{}
      timestamps()
    end
    create index(:financial_accounts, [:user_id])
    create index(:financial_accounts, [:user_id, :institution_id])

    # 3. Statement imports (job tracking)
    create table(:statement_imports, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :account_id, references(:financial_accounts, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :provider, :string, null: false
      add :source, :string, null: false
      add :file_hash, :string
      add :statement_period, :string
      add :status, :string, default: "pending"
      add :summary, :map
      add :error, :map
      add :transaction_count, :integer, default: 0
      timestamps()
      add :completed_at, :naive_datetime
    end
    create index(:statement_imports, [:account_id])
    create index(:statement_imports, [:user_id])
    create index(:statement_imports, [:file_hash])

    # 4. Canonical transactions
    create table(:transactions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :account_id, references(:financial_accounts, type: :binary_id, on_delete: :delete_all), null: false
      add :import_id, references(:statement_imports, type: :binary_id, on_delete: :nilify_all)
      add :occurred_on, :date, null: false
      add :occurred_at, :naive_datetime
      add :narrative, :text
      add :debit, :decimal, precision: 19, scale: 4, default: 0
      add :credit, :decimal, precision: 19, scale: 4, default: 0
      add :balance, :decimal, precision: 19, scale: 4
      add :type, :string
      add :category, :string
      add :provider_ref, :string
      add :raw, :map
      add :transfer_match_id, :binary_id
      timestamps()
    end
    create index(:transactions, [:account_id])
    create index(:transactions, [:account_id, :occurred_on])
    create index(:transactions, [:import_id])
    create index(:transactions, [:provider_ref, :account_id])
    create index(:transactions, [:transfer_match_id])

    # 5. Balance snapshots
    create table(:balance_snapshots, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :account_id, references(:financial_accounts, type: :binary_id, on_delete: :delete_all), null: false
      add :import_id, references(:statement_imports, type: :binary_id, on_delete: :nilify_all)
      add :amount, :decimal, precision: 19, scale: 4, null: false
      add :currency, :string, default: "KES"
      add :source, :string, null: false
      add :snapshot_at, :naive_datetime, null: false
      timestamps()
    end
    create index(:balance_snapshots, [:account_id])
    create index(:balance_snapshots, [:account_id, :snapshot_at])

    # 6. Assets (non-account)
    create table(:assets, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :name, :string, null: false
      add :type, :string, null: false
      add :value, :decimal, precision: 19, scale: 4, null: false
      add :currency, :string, default: "KES"
      add :metadata, :map, default: %{}
      add :acquired_at, :date
      timestamps()
    end
    create index(:assets, [:user_id])

    # 7. Liabilities
    create table(:liabilities, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :name, :string, null: false
      add :type, :string, null: false
      add :outstanding, :decimal, precision: 19, scale: 4, null: false
      add :currency, :string, default: "KES"
      add :interest_rate, :decimal, precision: 6, scale: 4
      add :due_date, :date
      add :metadata, :map, default: %{}
      timestamps()
    end
    create index(:liabilities, [:user_id])

    # 8. Net worth snapshots
    create table(:net_worth_snapshots, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :total_assets, :decimal, precision: 19, scale: 4, null: false
      add :total_liabilities, :decimal, precision: 19, scale: 4, null: false
      add :net_worth, :decimal, precision: 19, scale: 4, null: false
      add :currency, :string, default: "KES"
      add :breakdown, :map
      timestamps()
    end
    create index(:net_worth_snapshots, [:user_id])
    create index(:net_worth_snapshots, [:user_id, :inserted_at])

    # Migrate existing statements data to new schema
    migrate_existing_data()
  end

  defp migrate_existing_data do
    # Create financial_accounts from existing statements
    execute("""
      INSERT INTO financial_accounts (id, user_id, institution_id, account_type, name, currency, status, metadata, inserted_at, updated_at)
      SELECT
        gen_random_uuid(),
        s.user_id,
        fi.id,
        CASE
          WHEN s.provider IN ('mpesa', 'airtel') THEN 'wallet'
          WHEN s.provider = 'im' THEN 'checking'
          ELSE 'checking'
        END,
        CASE
          WHEN s.provider = 'mpesa' THEN 'M-Pesa Wallet'
          WHEN s.provider = 'airtel' THEN 'Airtel Wallet'
          WHEN s.provider = 'im' THEN 'I&M Bank Account'
          ELSE s.provider || ' Account'
        END,
        COALESCE(s.currency, 'KES'),
        'active',
        jsonb_build_object(
          'provider', s.provider,
          'statement_period', s.statement_period,
          'legacy_statement_id', s.id
        ),
        s.inserted_at,
        s.updated_at
      FROM statements s
      JOIN financial_institutions fi ON fi.code = s.provider
      ON CONFLICT DO NOTHING;
    """)

    # Create statement_imports from existing statements
    execute("""
      INSERT INTO statement_imports (id, account_id, user_id, provider, source, file_hash, statement_period, status, summary, transaction_count, inserted_at, completed_at)
      SELECT
        gen_random_uuid(),
        fa.id,
        s.user_id,
        s.provider,
        'pdf_upload',
        md5(s.id::text || s.updated_at::text),
        s.statement_period,
        'completed',
        s.summary,
        COALESCE((
          SELECT count(*) FROM statement_transactions st WHERE st.statement_id = s.id
        ), 0),
        s.inserted_at,
        s.updated_at
      FROM statements s
      JOIN financial_accounts fa ON fa.user_id = s.user_id
        AND fa.metadata->>'provider' = s.provider
        AND fa.metadata->>'legacy_statement_id' = s.id::text;
    """)

    # Migrate transactions
    execute("""
      INSERT INTO transactions (id, account_id, import_id, occurred_on, occurred_at, narrative, debit, credit, balance, type, provider_ref, raw, inserted_at, updated_at)
      SELECT
        gen_random_uuid(),
        fa.id,
        si.id,
        st.occurred_on,
        CASE
          WHEN st.occurred_at ~ '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}' THEN st.occurred_at::timestamp
          ELSE NULL
        END,
        st.narrative,
        COALESCE(st.debit, 0),
        COALESCE(st.credit, 0),
        st.balance,
        CASE
          WHEN COALESCE(st.debit, 0) > 0 THEN 'debit'
          WHEN COALESCE(st.credit, 0) > 0 THEN 'credit'
          ELSE 'unknown'
        END,
        st.raw->>'receiptNo',
        st.raw,
        st.inserted_at,
        st.updated_at
      FROM statement_transactions st
      JOIN statements s ON s.id = st.statement_id
      JOIN financial_accounts fa ON fa.user_id = s.user_id
        AND fa.metadata->>'provider' = s.provider
        AND fa.metadata->>'legacy_statement_id' = s.id::text
      JOIN statement_imports si ON si.account_id = fa.id
        AND si.user_id = s.user_id
        AND si.provider = s.provider;
    """)

    # Create balance_snapshots from statement balances
    execute("""
      INSERT INTO balance_snapshots (id, account_id, import_id, amount, currency, source, snapshot_at, inserted_at, updated_at)
      SELECT
        gen_random_uuid(),
        fa.id,
        si.id,
        COALESCE(s.balance, 0),
        COALESCE(s.currency, 'KES'),
        'statement',
        s.inserted_at,
        s.inserted_at,
        s.updated_at
      FROM statements s
      JOIN financial_accounts fa ON fa.user_id = s.user_id
        AND fa.metadata->>'provider' = s.provider
        AND fa.metadata->>'legacy_statement_id' = s.id::text
      JOIN statement_imports si ON si.account_id = fa.id
        AND si.user_id = s.user_id
        AND si.provider = s.provider
      WHERE s.balance IS NOT NULL;
    """)
  end

  def down do
    drop table(:net_worth_snapshots)
    drop table(:liabilities)
    drop table(:assets)
    drop table(:balance_snapshots)
    drop table(:transactions)
    drop table(:statement_imports)
    drop table(:financial_accounts)
    drop table(:financial_institutions)
  end
end