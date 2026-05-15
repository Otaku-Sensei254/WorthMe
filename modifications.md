# Modifications

## Parser updates
- Updated the Airtel parser so `bundle purchase` rows are parsed as debits.
- Added Airtel statement summary extraction for opening balance, closing balance, total credit, and total debit.
- Updated the M-Pesa parser to capture customer metadata from the PDF header layout.
- Added debug output for M-Pesa customer name while troubleshooting.
- Matched the M-Pesa summary table to the PDF structure with `PAID IN` and `PAID OUT`.

## Frontend updates
- Added a shared wealth context to store parsed statement snapshots in memory.
- Cached logged-in user data in the browser for temporary state persistence.
- Added a profile page at `/profile`.
- Updated the navbar to link to the profile page.
- Reworked the dashboard to show actual statement-backed balances for M-Pesa and Airtel.
- Updated the assets panel to use live wallet snapshots instead of placeholder values.
- Updated the right panel to show recent parsed transactions from the stored snapshots.
- Styled the dashboard and profile page to fit the new data-driven layout.

## Data handling
- M-Pesa worth is derived from the parsed current balance.
- Airtel worth is derived from the parsed closing balance.
- Wallet snapshots are stored per logged-in user in `localStorage`.
- The app currently behaves as a session-based prototype, not a database-backed product.

## Repo hygiene
- Removed tracked `node_modules` and `.env` files from Git history.
- Added ignore rules so nested `node_modules` and `.env` files stay out of the repository.

## Live Sync Integration (M-Pesa)
- **Go Payment Service**: Created a Go-based "bridge" service in `backend/payment-data-service/` that uses the `payment-rails` SDK.
- **.env Mapping**: Implemented a flexible `.env` loader in Go to handle `export` keywords and map custom key names (e.g., `MPESA_CUSTOMER_CONSUMER_KEY`).
- **Callback Listener**: Added an asynchronous callback handler in Go to receive balance data from Safaricom.
- **Phoenix API**: Added `WorthMeWeb.MpesaController` and routes (`/api/mpesa/sync` and `/api/mpesa/status/:id`) to bridge the frontend and Go service.
- **Frontend Sync**: Added a "Sync M-Pesa Live" button to `DashView.jsx` with full polling logic to update the dashboard worth in real-time once the callback is received.

