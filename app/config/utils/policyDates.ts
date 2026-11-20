const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function policyDateValue(value?: string | null): string {
  const raw = String(value || "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(raw);
  if (!match) return "";
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) return "";
  if (raw.length > 10 && Number.isNaN(Date.parse(raw))) return "";
  // Effective dates are civil dates; retain the written date, not its timezone-converted instant.
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function formatPolicyDate(value?: string | null, emptyLabel = "Not set"): string {
  const key = policyDateValue(value);
  if (!key) return emptyLabel;
  const [year, month, day] = key.split("-");
  return `${day} ${MONTHS[Number(month) - 1]} ${year}`;
}

export function todayPolicyDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
