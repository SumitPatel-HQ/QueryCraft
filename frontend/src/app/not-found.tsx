"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col bg-zinc-950 text-white"
    >
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-5xl mx-auto relative px-4">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <h1 className="text-8xl font-black gradient-text mb-4">404</h1>
              <p className="text-2xl text-[rgba(255,255,255,0.6)] mb-8">Page Not Found</p>
              <Link 
                href="/"
                className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-glow"
                style={{ background: "var(--gradient-primary)" }}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
