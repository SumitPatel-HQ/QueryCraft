"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { TypingDemo } from "../components/TypingDemo";
import { AuroraTextEffect } from "@/components/lightswind/aurora-text-effect";
import RippleButton from "@/components/lightswind/ripple-button";
import { AnimatedScrollButton } from "@/components/ui/animated-scroll-button";
import ShinyText from "@/components/ui/ShinyText";

interface HeroSectionProps {
  onCTAClick: () => void;
  onSignUpClick: () => void;
}

export function HeroSection({ onCTAClick, onSignUpClick }: HeroSectionProps) {
  return (
    <section id="hero" className="relative overflow-hidden pt-8 sm:pt-12 pb-24 sm:pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mx-auto"
        >
          <Badge 
            className="mb-4 sm:mb-5 shadow-glow backdrop-blur-xl bg-primary/10 border border-primary/20 text-xs sm:text-sm" 
            variant="secondary"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered SQL Generation
          </Badge>
          
          <div className="mb-3 px-2">
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight" 
              style={{ color: 'rgba(255, 255, 255, 0.87)' }}
            >
              Let <AuroraTextEffect text="QueryAI" /> write your SQL for you
            </h1>
          </div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl mb-5 sm:mb-6 px-4 mx-auto max-w-5xl" 
            style={{ 
              color: 'rgba(255, 255, 255, 0.70)',
              lineHeight: '1.6',
              fontWeight: '400'
            }}
          >
            The fastest way to get  <AuroraTextEffect text="actionable insights" /> from your database just by asking questions
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-10 px-4"
          >
            <RippleButton
              text="Try Demo"
              onClick={onCTAClick}
              bgColor="linear-gradient(135deg, #6366F1, #8B5CF6)"
              circleColor="rgba(168, 85, 247, 0.6)"
              className="shadow-glow text-sm sm:text-md h-11 sm:h-12 px-5 sm:px-6 font-semibold  sm:w-auto"
            />
            <Button 
              size="lg" 
              variant="outline" 
              onClick={onSignUpClick} 
              className="shadow-md hidden md:block text-sm sm:text-md h-11 sm:h-12 px-5 sm:px-6 font-semibold backdrop-blur-xs bg-black/10 hover:bg-black/30 rounded-xl w-full sm:w-auto" 
              style={{
                border: 'px solid rgba(255, 255, 255, 0.12)'
              }}
            >
              <ShinyText text="Sign Up Free" speed={2} intensity="low" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="max-w-3xl mx-auto px-2"
          >
            <TypingDemo />
          </motion.div>
        </motion.div>
      </div>
      <div className="hidden sm:block absolute bottom-17 left-1/2 transform -translate-x-1/2">
        <AnimatedScrollButton />
      </div>
    </section>
  );
}
