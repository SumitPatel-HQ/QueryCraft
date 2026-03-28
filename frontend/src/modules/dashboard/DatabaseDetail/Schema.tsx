"use client";

export default function SchemaTab() {
  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="sticky top-0 z-10 mb-6">
        <input
          placeholder="Search tables..."
          className="w-full h-12 rounded-xl px-4"
          style={{
            background: "rgba(30,30,30,0.95)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />
      </div>

      <div className="flex flex-col gap-4">
        {["customers", "orders", "products", "order_items", "categories"].map((t) => (
          <div
            key={t}
            className="rounded-xl p-6 transition-transform"
            style={{
              background: "rgba(30,30,30,0.6)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[1.125rem] font-semibold">{t}</div>
                <div className="text-sm text-[rgba(255,255,255,0.60)] mt-1">100,000 rows</div>
              </div>
              <button className="px-3 py-1.5 rounded-lg text-sm" style={{ color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.4)" }}>View</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-2 mt-4">
              {[
                "customer_id (INT, PK)",
                "customer_name (VARCHAR)",
                "email (VARCHAR)",
                "created_at (TIMESTAMP)",
                "country (VARCHAR)",
              ].map((c, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm rounded-md px-3 py-2" style={{ background: "rgba(18,18,18,0.6)" }}>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


