# Discussions

## Product direction.

- Build a Kenya-focused net-worth aggregator.
- Let users link multiple financial sources in one app.
- Support wallets, bank accounts, investments, debts, loans, and assets.
- Prioritize M-Pesa and Airtel Money first because those are the immediate data sources available in this repo.

## Statement parsing approach

- Use uploaded PDF statements as the initial data source.
- Avoid asking for bank passwords or wallet PINs.
- Parse statement summaries and transaction tables.
- Treat the statement summary as the primary worth source for wallet balances.

## M-Pesa parsing rules

- Customer name appears on the row above `Customer Name:` in the PDF layout.
- `Debug customer name` was added during troubleshooting to verify parser output.
- The summary table at the top should be used to derive wallet worth.
- The UI should show the customer name clearly when it is available.

## Airtel parsing rules

- Rows containing `bundle purchase` should go to `debit`.
- The rightmost numeric value on a transaction row should be treated as the balance.
- Airtel summary values should be displayed prominently at the top of the statement view.

## Temporary data strategy

- There is no database yet.
- Use in-memory browser state plus `localStorage` so the logged-in user can keep a temporary worth snapshot.
- Store separate wallet snapshots for M-Pesa and Airtel under the current user session.
- Use those snapshots to populate the dashboard and profile page.

## UI direction

- Add a user profile page that shows session-based user data.
- Make the dashboard show actual wallet balances instead of placeholder values.
- Show connected wallet snapshots and recent parsed transactions.
- Keep the worth figures statement-backed until a database is introduced.

## Live Sync Strategy (Active Development)

- **Goal**: Transition from manual PDF uploads to real-time API fetching.
- **Architecture**: React (Frontend) ↔ Phoenix (Orchestrator) ↔ Go (Payment Rails) ↔ Safaricom Daraja.
- **Current Constraint**: The standard Daraja Business API fetches Business (Shortcode) balances. Personal balance fetching requires a Consumer-level API or a partnership.
- **Polling Mechanism**: Since M-Pesa balance responses are asynchronous, the frontend uses a `ConversationID` to poll the Go service until the Safaricom callback arrives.
