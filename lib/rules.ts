// Business rules shared by the store and admin dashboard.
export function slotsLeft(total: number, used: number) {
  return Math.max(0, total - used);
}
export function canAssign(maxSlots: number, activeOnAccount: number) {
  return activeOnAccount < maxSlots;
}
export function expiryFrom(start: Date, months: number) {
  const d = new Date(start);
  d.setMonth(d.getMonth() + months);
  return d;
}
export function daysLeft(expiresAt: string | null, now = new Date()) {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / 86400000));
}
export function discountPct(price: number, mrp: number | null) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}
export function upiLink(upiId: string, name: string, amount: number, note: string) {
  const p = new URLSearchParams({ pa: upiId, pn: name, am: String(amount), cu: "INR", tn: note });
  return `upi://pay?${p.toString()}`;
}
export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export function refundAllowedAfterDelivery(credentialsProvided: boolean) { return !credentialsProvided; }
