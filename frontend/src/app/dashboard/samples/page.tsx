"use client";

import { Card } from "@/components/ui/card";

const sampleQueries = [
  {
    title: "Basic Select",
    query: "SELECT * FROM users LIMIT 10;",
    description: "Retrieve common fields from the users table."
  },
  {
    title: "Join Example",
    query: "SELECT u.name, o.order_date FROM users u JOIN orders o ON u.id = o.user_id;",
    description: "Combine user names with their order dates."
  },
  {
    title: "Aggregation",
    query: "SELECT category, COUNT(*) as count FROM products GROUP BY category;",
    description: "Count products in each category."
  }
];

export default function SamplesPage() {
  return (
    <div className="flex flex-col items-start gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white px-2">Sample Questions</h1>
        <p className="text-[rgba(255,255,255,0.6)] px-2">Common SQL queries and patterns to get you started.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {sampleQueries.map((q, index) => (
          <Card key={index} className="p-6 bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <h3 className="text-xl font-semibold mb-2 text-white">{q.title}</h3>
            <p className="text-sm text-[rgba(255,255,255,0.6)] mb-4">{q.description}</p>
            <div className="bg-[#1e1e1e] p-3 rounded-md font-mono text-xs text-blue-400 overflow-x-auto whitespace-pre">
              {q.query}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
