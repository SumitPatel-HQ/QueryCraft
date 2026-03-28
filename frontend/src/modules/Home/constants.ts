export const TYPED_TEXT = "Show me all users who signed up last month";

export const STATS_DATA = [
  { stat: "50%", text: "of analyst time wasted on routine queries" },
  { stat: "3-5 days", text: "average wait time for data requests" },
  { stat: "100+", text: "Slack messages per data request" }
];

export const SOLUTION_STEPS = [
  { 
    step: "1", 
    title: "Ask in Plain English", 
    desc: "Type your question naturally, no SQL needed" 
  },
  { 
    step: "2", 
    title: "AI Generates SQL", 
    desc: "Our AI translates to optimized SQL queries" 
  },
  { 
    step: "3", 
    title: "Get Results Instantly", 
    desc: "View data in tables, charts, or export" 
  }
];

export const FEATURES_DATA = [
  { 
    title: "Natural Language Queries", 
    desc: "Ask questions in plain English, no SQL knowledge required" 
  },
  { 
    title: "Transparent SQL Generation", 
    desc: "See and edit the generated SQL for full control" 
  },
  { 
    title: "Multi-Database Support", 
    desc: "Works with PostgreSQL, MySQL, MongoDB, and more" 
  },
  { 
    title: "Team Collaboration", 
    desc: "Share queries, results, and insights with your team" 
  },
  { 
    title: "Enterprise Security", 
    desc: "SOC 2 compliant with role-based access control" 
  },
  { 
    title: "Auto-Visualization", 
    desc: "Automatic chart generation from query results" 
  }
];

export const USE_CASES = [
  { 
    role: "Product Managers", 
    icon: "📊",
    tasks: ["Track feature adoption", "Analyze user behavior", "Monitor KPIs in real-time"]
  },
  { 
    role: "Marketing Analysts", 
    icon: "📈",
    tasks: ["Campaign performance", "Customer segmentation", "ROI analysis"]
  },
  { 
    role: "Business Ops Teams", 
    icon: "⚙️",
    tasks: ["Revenue reporting", "Process optimization", "Operational metrics"]
  },
  { 
    role: "Customer Success", 
    icon: "🤝",
    tasks: ["Account health scores", "Usage analytics", "Churn prediction"]
  }
];

export const PRICING_PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["100 queries/month", "1 database connection", "Basic visualizations", "Community support"],
    cta: "Start Free",
    popular: false
  },
  {
    name: "Pro",
    price: "$29",
    period: "per user/month",
    features: ["Unlimited queries", "Unlimited databases", "Advanced visualizations", "Priority support", "Team collaboration", "API access"],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    features: ["Everything in Pro", "SSO & SAML", "Dedicated support", "Custom integrations", "SLA guarantee", "On-premise option"],
    cta: "Contact Sales",
    popular: false
  }
];

export const FAQ_DATA = [
  { 
    q: "How accurate is the SQL generation?", 
    a: "Our AI achieves 95%+ accuracy on common queries and learns from your corrections to improve over time." 
  },
  { 
    q: "What databases do you support?", 
    a: "We support PostgreSQL, MySQL, MongoDB, Snowflake, BigQuery, Redshift, and more. Contact us for specific integrations." 
  },
  { 
    q: "Is my data secure?", 
    a: "Yes. We're SOC 2 Type II certified, use end-to-end encryption, and never store your actual data—only metadata for query generation." 
  },
  { 
    q: "Can I edit the generated SQL?", 
    a: "Absolutely! You can view, edit, and save custom SQL queries. Our AI learns from your edits." 
  },
  { 
    q: "Do you offer a free trial?", 
    a: "Yes! All paid plans include a 14-day free trial with full access to all features." 
  }
];

export const NAV_LINKS = [
  { label: "Home", href: "#hero" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
  { label: "FAQ", href: "#faq" }
];

export const FOOTER_LINKS = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Integrations", href: "#" },
    { label: "Changelog", href: "#" }
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" }
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Security", href: "#" }
  ]
};
