"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import TextType from "@/components/ui/TextType";
// import { MessageSquare, Sparkles, BarChart3 } from "lucide-react";
// import { StepCard } from "../components/StepCard";
// import { SOLUTION_STEPS } from "../constants";

// const ICON_MAP = {
//   "1": MessageSquare,
//   "2": Sparkles,
//   "3": BarChart3
// };

export function SolutionSection() {
  return (
    <section className="py-8 sm:py-10 px-4">
      <div className="max-w-7xl mx-auto">
         {/* Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8 sm:mb-10 px-4">
            <TextType
              text="How QueryCraft Works"
              typingSpeed={50}
              showCursor={true}
              cursorClassName="text-blue-400"
              loop={true}
              startOnVisible={true}
              initialDelay={800}
              pauseDuration={3000}
              deletingSpeed={30}
            />
          </h2>
          
        </motion.div>
         {/* Demo Video Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <Card 
            className="shadow-2xl overflow-hidden backdrop-blur-xs bg-white/5 border border-white/10" 
            style={{ borderRadius: '16px' }}
          >
            <div className="aspect-video flex items-center justify-center bg-[#0D0D0D]">
              <div className="text-center px-4">
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-glow cursor-pointer hover:scale-110 transition-transform" 
                  style={{
                    width: '64px',
                    height: '64px'
                  }}
                >
                  <div className="w-0 h-0 border-t-[6px] sm:border-t-8 border-t-transparent border-l-[10px] sm:border-l-12 border-l-primary-foreground border-b-[6px] sm:border-b-8 border-b-transparent ml-1"></div>
                </div>
                <p className="text-base sm:text-lg font-medium">Watch 2-Minute Demo</p>
                <p className="text-xs sm:text-sm text-muted-foreground">See QueryAI in action</p>
              </div>
            </div>
          </Card>
        </motion.div>

       

       
      </div>
    </section>
  );
}
