"use client";

import { Card } from "@/components/ui/card";

const sampleQueries = [
  {
    title: "Highest Spenders",
    query: "SELECT u.name, SUM(o.total_amount) as total_spent\nFROM users u\nJOIN orders o ON u.id = o.user_id\nGROUP BY u.id\nORDER BY total_spent DESC\nLIMIT 5;",
    description: "Identify the top 5 customers based on their total lifetime spending."
  },
  {
    title: "Inventory Status",
    query: "SELECT name, stock_quantity, price\nFROM products\nWHERE stock_quantity < 50 AND is_active = true\nORDER BY stock_quantity ASC;",
    description: "List active products that are running low on stock."
  },
  {
    title: "Monthly Revenue Trend",
    query: "SELECT strftime('%Y-%m', order_date) as month,\n       SUM(total_amount) as revenue,\n       COUNT(*) as order_count\nFROM orders\nGROUP BY month\nORDER BY month DESC;",
    description: "Analyze revenue and transaction volume trends month-over-month."
  },
  {
    title: "Product Performance",
    query: "SELECT p.name, COUNT(oi.product_id) as units_sold,\n       SUM(oi.price * oi.quantity) as total_revenue\nFROM products p\nJOIN order_items oi ON p.id = oi.product_id\nGROUP BY p.id\nORDER BY units_sold DESC\nLIMIT 10;",
    description: "Find the top 10 best-selling products by quantity and revenue."
  },
  {
    title: "Customer Segment Summary",
    query: "SELECT country, COUNT(*) as customer_count,\n       AVG(age) as average_age\nFROM users\nGROUP BY country\nHAVING customer_count > 10\nORDER BY customer_count DESC;",
    description: "Get a demographic overview of customers grouped by country."
  },
  {
    title: "Recently Lost Customers",
    query: "SELECT name, email, last_login_date\nFROM users\nWHERE last_login_date < date('now', '-30 days')\n  AND is_subscribed = true\nORDER BY last_login_date ASC;",
    description: "Identify subscribed users who haven't logged in for over 30 days."
  },
  {
    title: "Average Order Value",
    query: "SELECT AVG(total_amount) as aov,\n       MIN(total_amount) as min_order,\n       MAX(total_amount) as max_order\nFROM orders\nWHERE status = 'completed';",
    description: "Calculate key order metrics for successfully completed transactions."
  },
  {
    title: "Category Insights",
    query: "SELECT category, ROUND(AVG(price), 2) as avg_price,\n       MIN(price) as min_price, MAX(price) as max_price\nFROM products\nGROUP BY category\nORDER BY avg_price DESC;",
    description: "Compare price ranges and averages across different product categories."
  },
  {
    title: "Shipping Latency",
    query: "SELECT id, order_date, shipping_date,\n       (julianday(shipping_date) - julianday(order_date)) as days_to_ship\nFROM orders\nWHERE shipping_date IS NOT NULL\nORDER BY days_to_ship DESC\nLIMIT 10;",
    description: "Measure fulfillment speed by calculating interval between order and shipping."
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
