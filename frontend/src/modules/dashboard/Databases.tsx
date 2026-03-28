"use client";

export default function DatabasesView() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black">My Databases</h1>
          <p className="mt-2 text-[rgba(255,255,255,0.60)]">
            3 databases connected
          </p>
        </div>
        <button
          className="px-5 py-3 rounded-xl font-semibold shadow-glow"
          style={{ background: "var(--gradient-primary)", color: "#fff" }}
        >
          + Add Database
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative rounded-2xl p-8 overflow-hidden"
            style={{
              background: "rgba(30,30,30,0.6)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl grid place-items-center text-2xl"
                  style={{ background: "var(--gradient-primary)" }}
                  aria-hidden
                >
                  📊
                </div>
                <div>
                  <div className="text-xl font-bold">
                    {i === 1
                      ? "E-commerce Database"
                      : i === 2
                      ? "Analytics Warehouse"
                      : "Sample Database"}
                  </div>
                  <div className="text-sm text-[rgba(255,255,255,0.60)] mt-1">
                    {i === 1 ? "PostgreSQL • ecommerce.acme.com" : i === 2 ? "MySQL • analytics.acme.com" : "SQLite • local"}
                  </div>
                  <div className="text-xs text-[rgba(255,255,255,0.38)] mt-2">Last queried: 2h ago</div>
                </div>
              </div>
              <div className="flex gap-2">
                {[
                  { label: "⚙️", aria: "Settings" },
                  { label: "🗑️", aria: "Delete" },
                ].map((a) => (
                  <button
                    key={a.aria}
                    aria-label={a.aria}
                    className="w-8 h-8 rounded-md"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="my-6 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

            <div className="flex flex-wrap gap-8 text-[0.875rem]">
              <div className="text-[1.25rem]">📊 45 tables</div>
              <div className="text-[1.25rem]">🔄 Schema synced 1 day ago</div>
              <div className="text-[1.25rem]">💬 128 queries this week</div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="px-3 py-2 rounded-lg text-sm" style={{ color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.4)" }}>View Schema</button>
              <button className="px-3 py-2 rounded-lg text-sm" style={{ color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.4)" }}>View ERD</button>
              <button className="px-3 py-2 rounded-lg text-sm text-white" style={{ background: "var(--gradient-primary)" }}>New Query</button>
              <button className="px-3 py-2 rounded-lg text-sm" style={{ color: "rgba(255,255,255,0.87)", border: "1px solid rgba(255,255,255,0.2)" }}>Settings</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


