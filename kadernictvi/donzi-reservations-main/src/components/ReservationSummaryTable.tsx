type Row = { label: string; value: string };

type Props = {
  rows: Row[];
  className?: string;
};

/** Přehled rezervace — štítky vlevo, hodnoty vpravo */
export function ReservationSummaryTable({ rows, className }: Props) {
  return (
    <div
      className={
        className ??
        "rounded-lg border border-gold/25 bg-muted/40 overflow-hidden text-sm"
      }
    >
      <table className="w-full">
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.label}
              className={i < rows.length - 1 ? "border-b border-border/60" : undefined}
            >
              <td className="px-4 py-3 text-muted-foreground w-[38%] align-top">
                {row.label}
              </td>
              <td className="px-4 py-3 font-medium text-right break-words">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
