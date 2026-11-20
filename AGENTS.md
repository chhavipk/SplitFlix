# Project notes for developers

## Architecture

- TanStack Start file-based routing: every page is a file in `src/routes`;
  `__root.tsx` is the only shell and must keep `<Outlet />`.
- App-internal server logic uses `createServerFn` from `@tanstack/react-start`;
  public HTTP endpoints live in `src/routes/api/`.
- The browser talks to the database through the publishable client with
  row-level security; privileged actions go through `SECURITY DEFINER` SQL
  functions so the checks stay in the database.
- The secret/service-role client is imported inside a handler only, after the
  caller's admin role has been verified.
- Pure business rules live in `src/lib/rules.ts` with tests in
  `src/test/rules.test.ts`; catalog filtering and cart totals live in
  `src/lib/marketplace.ts` with tests in `src/test/marketplace.test.ts`.

## Invariants

- Order price is set by a database trigger from `plans`, never trusted from the
  client.
- Combo and cart prices are the sum of existing plan prices; no bundle discount.
- Multi-plan checkout goes through the `submit_cart` database function.
- The shopping provider persists only cart and saved product IDs — never
  credentials or authoritative prices.
- Customer reviews require an owned fulfilled order and admin approval before
  public display; never seed invented testimonials.
- No refunds after login credentials are provided, subject to applicable law.
- The first account to sign up becomes admin through the signup trigger.
- Checkout stays blocked while the UPI ID is still the placeholder value.
- `VITE_`-prefixed variables reach the browser; keep every secret unprefixed.

## Commands

`npm run dev` · `npm run build` · `npm run preview` · `npm test` · `npm run lint`
