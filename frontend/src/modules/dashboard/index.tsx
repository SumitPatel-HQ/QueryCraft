"use client";

export default function DashboardHome() {
  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
      <section
        className="relative rounded-2xl p-10 overflow-hidden"
        style={{
          background: "rgba(30,30,30,0.6)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          aria-hidden
          className="absolute -right-20 -top-20 w-[400px] h-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <h1 className="text-4xl font-black">Welcome to QueryCraft 👋</h1>
        <p className="mt-3 text-lg text-[rgba(255,255,255,0.60)]">
          Ask questions about your data in plain English
        </p>

        <div className="mt-8 flex flex-wrap gap-10">
          {[
            { label: "Queries Remaining", value: "15/20", icon: "💬" },
            { label: "Databases Available", value: "3", icon: "📊" },
            { label: "Recent Queries", value: "12", icon: "📈" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <div
                className="h-10 w-10 rounded-xl grid place-items-center text-lg"
                style={{ background: "var(--gradient-primary)" }}
                aria-hidden
              >
                {s.icon}
              </div>
              <div>
                <div className="text-2xl font-bold gradient-text">{s.value}</div>
                <div className="text-sm text-[rgba(255,255,255,0.60)]">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-5">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { title: "+ New Query", desc: "Start a fresh question", icon: "💬" },
            { title: "Browse Databases", desc: "Explore your data", icon: "📊" },
            { title: "Upload Data", desc: "Upload CSV or files", icon: "📤" },
          ].map((a) => (
            <button
              key={a.title}
              className="rounded-xl p-8 text-left transition-transform"
              style={{
                background: "rgba(30,30,30,0.6)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onClick={() => {}}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-8px) scale(1.02)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              <div
                className="w-14 h-14 rounded-xl grid place-items-center text-2xl mb-5"
                style={{ background: "var(--gradient-primary)" }}
                aria-hidden
              >
                {a.icon}
              </div>
              <div className="text-[rgba(255,255,255,0.87)] text-lg font-semibold">
                {a.title}
              </div>
              <div className="text-sm text-[rgba(255,255,255,0.60)] mt-2">{a.desc}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold">Recent Queries</h2>
          <button className="text-sm text-[#8B5CF6]">View All →</button>
        </div>
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "rgba(30,30,30,0.6)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="p-8 text-center text-[rgba(255,255,255,0.60)]">
            No queries yet. Start by asking a question about your data.
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold">Connected Databases</h2>
          <button
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              color: "#8B5CF6",
              border: "1px solid rgba(139,92,246,0.4)",
              background: "transparent",
            }}
          >
            + Add Database
          </button>
        </div>
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl p-6 transition-transform cursor-pointer"
              style={{
                background:
                  "linear-gradient(135deg, rgba(30,30,30,0.9), rgba(45,45,45,0.5))",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 rounded-xl grid place-items-center"
                  style={{ background: "var(--gradient-primary)" }}
                  aria-hidden
                >
                  📊
                </div>
                <div
                  className="text-xs px-2 py-1 rounded-md"
                  style={{
                    background: "rgba(16,185,129,0.15)",
                    color: "#10B981",
                  }}
                >
                  ✓ Connected
                </div>
              </div>
              <div className="mt-4 text-[1.125rem] font-semibold">
                {i === 1
                  ? "E-commerce Database"
                  : i === 2
                  ? "Analytics Warehouse"
                  : "Sample Database"}
              </div>
              <div className="text-sm text-[rgba(255,255,255,0.60)] mt-1">
                {i === 1 ? "PostgreSQL" : i === 2 ? "MySQL" : "SQLite"}
              </div>
              <div className="mt-5 flex gap-5 text-sm">
                <div>🗃️ 45 tables</div>
                <div>⏱️ 2h ago</div>
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  className="px-3 py-1.5 rounded-lg text-sm"
                  style={{
                    color: "#8B5CF6",
                    border: "1px solid rgba(139,92,246,0.4)",
                    background: "transparent",
                  }}
                >
                  View Schema
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg text-sm"
                  style={{
                    color: "#8B5CF6",
                    border: "1px solid rgba(139,92,246,0.4)",
                    background: "transparent",
                  }}
                >
                  New Query
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


