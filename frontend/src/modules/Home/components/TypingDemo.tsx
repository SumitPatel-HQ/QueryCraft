"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Code2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DEMO_QUESTIONS = [
  {
    question: "Show me all users who signed up in the last month",
    sql: `SELECT * FROM users WHERE signup_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH);`
  },
  {
    question: "What are the top 5 products by revenue?",
    sql: `SELECT product_name, SUM(revenue) as total_revenue FROM sales GROUP BY product_name ORDER BY total_revenue DESC LIMIT 5;`
  },
  {
    question: "Find customers who haven't made a purchase in 90 days",
    sql: `SELECT c.* FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE o.order_date < DATE_SUB(NOW(), INTERVAL 90 DAY) OR o.id IS NULL;`
  },
  {
    question: "Calculate the average order value by month",
    sql: `SELECT DATE_FORMAT(order_date, '%Y-%m') as month, AVG(total_amount) as avg_order_value FROM orders GROUP BY month ORDER BY month DESC;`
  },
  {
    question: "List employees with their department and salary",
    sql: `SELECT e.name, e.salary, d.department_name FROM employees e INNER JOIN departments d ON e.department_id = d.id ORDER BY e.salary DESC;`
  }
];

export function TypingDemo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSQL, setShowSQL] = useState(false);

  const currentDemo = DEMO_QUESTIONS[currentIndex];

  useEffect(() => {
    // Reset state for new question
    setTypedText("");
    setIsTyping(true);
    setIsGenerating(false);
    setShowSQL(false);

    let typingIndex = 0;
    const typingInterval = setInterval(() => {
      if (typingIndex <= currentDemo.question.length) {
        setTypedText(currentDemo.question.slice(0, typingIndex));
        typingIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        
        // Start generating SQL after typing completes
        setTimeout(() => {
          setIsGenerating(true);
          
          // Show SQL after "generating"
          setTimeout(() => {
            setIsGenerating(false);
            setShowSQL(true);
            
            // Move to next question after showing SQL
            setTimeout(() => {
              setCurrentIndex((prev) => (prev + 1) % DEMO_QUESTIONS.length);
            }, 3000);
          }, 1500);
        }, 500);
      }
    }, 50);

    return () => clearInterval(typingInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  return (
    <Card 
      className="shadow-2xl backdrop-blur-xs bg-white/5 transition-all duration-400" 
      style={{
        borderRadius: '16px',
        padding: '1rem'
      }}
    >
      <CardContent className="p-0">
        {/* Question Section */}
        <div 
          className="rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 text-left" 
          style={{
            background: 'rgba(18, 18, 18, 0.8)',
            borderRadius: '12px'
          }}
        >
          <p className="text-xs sm:text-sm mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2" style={{ color: 'rgba(255, 255, 255, 0.60)' }}>
            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: '#6366F1', filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.3))' }} />
            Your Question:
          </p>
          <p className="text-sm sm:text-base min-h-[1rem]" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
            {typedText}
            {isTyping && <span className="animate-pulse" style={{ color: '#6366F1' }}>|</span>}
          </p>
        </div>

        {/* SQL Section */}
        <div 
          className="rounded-lg sm:rounded-xl p-3 sm:p-4 text-left min-h-[80px] sm:min-h-[100px] flex flex-col" 
          style={{
            background: 'rgba(18, 18, 18, 0.95)',
            borderRadius: '12px'
          }}
        >
          <p className="text-xs sm:text-sm mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2" style={{ color: 'rgba(255, 255, 255, 0.60)' }}>
            <Code2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: '#6366F1', filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.3))' }} />
            Generated SQL:
          </p>
          
          <AnimatePresence mode="wait">
            {isGenerating && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 flex-1 justify-center"
              >
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" style={{ color: '#6366F1' }} />
                <span className="text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.60)' }}>
                  Generating query...
                </span>
              </motion.div>
            )}
            
            {showSQL && !isGenerating && (
              <motion.code
                key="sql"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-xs sm:text-sm font-mono flex-1 overflow-x-auto"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                dangerouslySetInnerHTML={{
                  __html: highlightSQL(currentDemo.sql)
                }}
              />
            )}
          </AnimatePresence>
        </div>

        
      </CardContent>
    </Card>
  );
}

// Helper function to highlight SQL syntax
function highlightSQL(sql: string): string {
  const keywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 'INNER JOIN', 'LEFT JOIN', 'ON', 'AS', 'DESC', 'ASC', 'AND', 'OR', 'IS', 'NULL', 'INTERVAL', 'DAY', 'MONTH'];
  const functions = ['DATE_SUB', 'NOW', 'SUM', 'AVG', 'DATE_FORMAT'];
  
  let highlighted = sql;
  
  // Highlight keywords
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    highlighted = highlighted.replace(regex, `<span class="sql-keyword">${keyword}</span>`);
  });
  
  // Highlight functions
  functions.forEach(func => {
    const regex = new RegExp(`\\b${func}\\b`, 'gi');
    highlighted = highlighted.replace(regex, `<span class="sql-function">${func}</span>`);
  });
  
  // Highlight numbers
  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="sql-number">$1</span>');
  
  // Highlight strings
  highlighted = highlighted.replace(/'([^']*)'/g, '<span class="sql-string">\'$1\'</span>');
  
  return highlighted;
}
