"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FAQ_DATA } from "../constants";

export function FAQSection() {
  return (
    <section id="faq" className="py-12 sm:py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight px-4">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="space-y-3 sm:space-y-4">
          {FAQ_DATA.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <Card 
                className="backdrop-blur-xs bg-[#1E1E1E]/60 border border-white/5 hover:border-primary/20 hover:shadow-glow transition-all duration-300" 
                style={{ borderRadius: '16px' }}
              >
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">{faq.q}</CardTitle>
                  <CardDescription className="text-sm sm:text-base pt-1 sm:pt-2">{faq.a}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
