"use client";

export default function ResultsTable() {
  const rows = [
    ["John Smith", "$1,589.97"],
    ["Mike Chen", "$1,099.98"],
    ["Emily Davis", "$799.99"],
    ["Sarah Johnson", "$199.99"],
  ];
  return (
    <div className="rounded-[10px] overflow-hidden bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)]">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#111111] border-b border-[rgba(255,255,255,0.05)]">
          <tr className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888888]">
            <th className="p-3 font-medium">Customer Name</th>
            <th className="p-3 font-medium">Total Spent</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="text-[13px] text-[#f0f0f0] border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
              <td className="p-3">{r[0]}</td>
              <td className="p-3 font-mono">{r[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
