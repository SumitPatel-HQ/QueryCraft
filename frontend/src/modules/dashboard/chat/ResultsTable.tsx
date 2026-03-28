"use client";

export default function ResultsTable() {
  const rows = [
    ["John Smith", "$1,589.97"],
    ["Mike Chen", "$1,099.98"],
    ["Emily Davis", "$799.99"],
    ["Sarah Johnson", "$199.99"],
  ];
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "rgba(18,18,18,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <table className="w-full">
        <thead style={{ background: "rgba(30,30,30,0.8)" }}>
          <tr className="text-[0.75rem] uppercase tracking-wider">
            <th className="text-left p-3">Customer Name</th>
            <th className="text-left p-3">Total Spent</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="text-sm border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <td className="p-3">{r[0]}</td>
              <td className="p-3">{r[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


