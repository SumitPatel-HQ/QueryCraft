"use client";

export default function OverviewTab() {
  return (
    <div className="max-w-[1200px] mx-auto">
      <div
        className="rounded-2xl p-8"
        style={{
          background: "rgba(30,30,30,0.6)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="text-lg font-semibold mb-4">Connection Status</div>
        <div className="flex items-center gap-3 text-sm">
          <span className="px-2 py-1 rounded-md" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>✓ Connected</span>
          <span className="text-[rgba(255,255,255,0.60)]">Host: ecommerce.acme.com • Port: 5432 • DB: ecommerce</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {[
            { label: "Tables", value: "45" },
            { label: "Total Rows", value: "1.2M" },
            { label: "Last Query", value: "5 min ago" },
            { label: "Queries Today", value: "23" },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center rounded-xl p-5"
              style={{ background: "rgba(18,18,18,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="text-2xl font-bold gradient-text">{s.value}</div>
              <div className="text-sm text-[rgba(255,255,255,0.60)] mt-2">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="text-lg font-semibold mb-3">Recent Queries</div>
          <div className="rounded-xl p-6 text-center text-[rgba(255,255,255,0.60)]" style={{ background: "rgba(30,30,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
            No recent queries on this database.
          </div>
        </div>
      </div>
    </div>
  );
}


