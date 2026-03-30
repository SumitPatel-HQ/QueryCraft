"use client";

import { motion } from "framer-motion";
import { MessageSquare, Code2, Database, Users, Shield, BarChart3, LucideIcon } from "lucide-react";
import { ScrollCarousel, ScrollCarouselItem } from "@/components/ui/ScrollCarousel";
import TextType from "@/components/ui/TextType";
import { FEATURES_DATA } from "../constants";

const ICON_MAP: LucideIcon[] = [MessageSquare, Code2, Database, Users, Shield, BarChart3];

export function FeaturesSection() {
  return (
    <section id="features" className="py-8 sm:py-10 px-4 bg-[#0D0D0D]/30 overflow-hidden">
      <div className="max-w-7xl mx-auto mb-8 sm:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mt-4 sm:mt-6 mb-3 sm:mb-4 bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent px-4">
            <TextType
              text="Powerful Features"
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
          <p className="text-lg sm:text-xl text-muted-foreground px-4">
            Everything you need to query your database
          </p>
          
        </motion.div>
      </div>

      <ScrollCarousel className="" speed={40} pauseOnHover={true}>
        {FEATURES_DATA.map((feature, index) => {
          const Icon = ICON_MAP[index];
          return (

            <ScrollCarouselItem key={index}>
              {/* 
                🎨 CARD CONTAINER 
                - p-6 sm:p-8 = responsive padding
                - min-h-[300px] sm:min-h-[350px] = responsive minimum height
              */}
              <div className="p-6 sm:p-8 h-full flex flex-col group">
                
                {/* 
                  🎯 ICON SECTION 
                  - w-14 h-14 sm:w-16 sm:h-16 = responsive icon container size
                  - mb-4 sm:mb-6 = responsive margin bottom spacing
                */}
                <div className="mb-4 sm:mb-6 relative">
                  {/* Icon glow effect */}
                  <div className="absolute inset-0 blur-lg rounded-full transition-all duration-300" />
                  
                  {/* 
                    Icon container with glass effect
                    - w-14 h-14 sm:w-16 sm:h-16 = responsive size
                    - from-white/20 to-white/5 = background opacity
                  */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/20 flex items-center justify-center backdrop-blur-xs group-hover:scale-110 transition-transform duration-300">
                    {/* Icon size - w-7 h-7 sm:w-8 sm:h-8 */}
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white/90" />
                  </div>
                </div>

                {/* 
                  📝 TITLE 
                  - text-xl sm:text-2xl = responsive font size
                  - text-white/95 = text color and opacity
                */}
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white/95 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                
                {/* 
                  📄 DESCRIPTION 
                  - text-sm sm:text-base = responsive font size
                  - text-white/70 = text color and opacity
                */}
                <p className="text-sm sm:text-base text-white/70 leading-relaxed group-hover:text-white/80 transition-colors">
                  {feature.desc}
                </p>

                
              </div>
            </ScrollCarouselItem>
          );
        })}
      </ScrollCarousel>
    </section>
  );
}
