/** Convierte filas en un CSV compatible con Excel y Google Sheets. */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "";
    const text = String(value);
    if (/[",\n;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const lines = [headers.map(escape).join(",")];
  rows.forEach(row => lines.push(row.map(escape).join(",")));
  // BOM para que Excel/Sheets reconozcan los acentos.
  return `\uFEFF${lines.join("\n")}`;
}

export function formatPy(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("es-PY", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Asuncion",
  }).format(date);
}
