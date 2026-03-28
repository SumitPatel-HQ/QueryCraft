"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic import for the TypingDemo to ensure no SSR issues with timers/timers
const TypingDemo = dynamic(
  () => import("@/modules/Home/components/TypingDemo").then(mod => mod.TypingDemo),
  { ssr: false }
);

export default function DemoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/")}
          className="mb-8 hover:bg-white/5"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-4xl font-black gradient-text">Interactive Demo</h1>
            <p className="text-[rgba(255,255,255,0.6)] mt-2">
              Experience how QueryCraft transforms your natural language questions into optimized SQL queries instantly.
            </p>
          </div>

          <div className="grid gap-8">
            <div className="rounded-2xl p-8 bg-zinc-900/50 border border-white/5">
              <h2 className="text-xl font-bold mb-6">AI SQL Generation</h2>
              <TypingDemo />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-zinc-900/30 border border-white/5">
                <h3 className="font-bold mb-2">Natural Language</h3>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
                  Type questions just like you'd ask a colleague. No need to know table names or join logic.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-zinc-900/30 border border-white/5">
                <h3 className="font-bold mb-2">Instant SQL</h3>
                <p className="text-sm text-[rgba(255,255,255,0.6)]">
                  Get production-ready SQL queries in milliseconds, optimized for your specific database schema.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
