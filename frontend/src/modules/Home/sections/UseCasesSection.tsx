"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import {
  ScrollCarousel,
  ScrollCarouselItem,
} from "@/components/ui/ScrollCarousel";
import TextType from "@/components/ui/TextType";
import { USE_CASES } from "../constants";

export function UseCasesSection() {
  return (
    <section
      id="use-cases"
      className="mt-4 sm:mt-6 px-4 bg-[#0D0D0D]/30 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto mb-8 sm:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3 sm:mb-4 bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent px-4 py-3">
            <TextType
              text="Built for Every Team"
              typingSpeed={75}
              showCursor={false}
              loop={true}
              startOnVisible={true}
              pauseDuration={2000}
              deletingSpeed={50}
            />
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground px-4">
            Empower your entire organization with data
          </p>
        </motion.div>
      </div>

      <ScrollCarousel className="" speed={40} pauseOnHover={true}>
        {USE_CASES.map((useCase, index) => (
          <ScrollCarouselItem key={index}>
            {/* 
              🎨 USE CASE CARD 
              - p-6 sm:p-8 = responsive padding
              - min-h-[320px] sm:min-h-[380px] = responsive minimum height
            */}
            <div className="p-6 sm:p-8 h-full flex flex-col group">
              {/* Icon and Role Header */}
              <div className="mb-4 sm:mb-6 flex items-center gap-3 sm:gap-4">
                {/* 
                  Icon container with glass effect
                  - w-14 h-14 sm:w-16 sm:h-16 = responsive icon container size
                */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                  <useCase.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>

                {/* Role Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-white/95 group-hover:text-white transition-colors">
                  {useCase.role}
                </h3>
              </div>

              {/* Tasks List */}
              <ul className="space-y-2.5 sm:space-y-3 flex-1">
                {useCase.tasks.map((task, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 sm:gap-3 group/item"
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 group-hover/item:text-blue-300 transition-colors" />
                    </div>
                    <span className="text-sm sm:text-base text-white/70 leading-relaxed group-hover:text-white/85 transition-colors">
                      {task}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollCarouselItem>
        ))}
      </ScrollCarousel>
    </section>
  );
}
