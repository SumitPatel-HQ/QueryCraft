"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PricingSectionProps {
  onCTAClick: () => void;
}

export function PricingSection({ onCTAClick }: PricingSectionProps) {
  const pricingPlans = [
    {
      name: "Starter",
      price: "$0",
      period: "/monthly",
      description: "Perfect for developers building web agents and data workflows.",
      cta: "Sign up with Starter",
      popular: false,
      features: [
        "50 free API calls/month",
        "$0.02 per API call after the initial limit",
        "10 API calls per minute",
        "10 hrs of remote browser included",
        "$0.12/hr of remote browser time",
        "5 concurrent remote browser sessions",
        "Community and email support",
        "Full access to developer tools",
      ],
    },
    {
      name: "Professional",
      price: "$20 ",
      period: "/monthly",
      description: "For teams running regular data workflows and web automation pipelines.",
      cta: "Sign up with Professional",
      popular: true,
      features: [
        "10,000 API calls/month included",
        "$0.015 per API call after the initial limit",
        "50 API calls per minute",
        "500 hrs of remote browser included",
        "$0.10/hr of remote browser time",
        "100 concurrent remote browser sessions",
        "Priority email support",
        "Community support",
        "Full access to developer tools",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "Fully managed solutions for accessing data from websites and documents.",
      cta: "Let's chat!",
      popular: false,
      features: [
        "Fastest time to market",
        "Ready-to-use datasets",
        "Fully managed dedicated cloud environment",
        "On-premise deployment available",
        "24/7 premium support",
        "Dedicated account manager",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-12 sm:py-16 md:py-20 px-4 bg-[#0D0D0D]/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent px-4 py-3">
            Explore all plans
          </h2>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-7xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative group"
            >
              {/* Card Container with Liquid Glass Effect */}
              <div
                className={`
                  relative h-full rounded-2xl sm:rounded-3xl p-6 sm:p-8
                  backdrop-blur-xl border transition-all duration-300
                  ${
                    plan.popular
                      ? "bg-gradient-to-br from-teal-900/30 via-teal-800/20 to-transparent border-teal-500/30 shadow-[0_0_30px_rgba(20,184,166,0.15)]"
                      : index === 0
                      ? "bg-gradient-to-br from-gray-800/30 via-gray-700/20 to-transparent border-white/10"
                      : "bg-gradient-to-br from-purple-900/30 via-purple-800/20 to-transparent border-purple-500/20"
                  }
                  hover:scale-[1.02] hover:shadow-2xl
                `}
              >
                {/* Dotted Pattern Background */}
                <div
                  className="absolute top-0 right-0 w-32 sm:w-48 h-24 sm:h-32 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, currentColor 1px, transparent 1px)",
                    backgroundSize: "8px 8px",
                  }}
                />

                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-2.5 sm:-top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-teal-500/90 text-white border-teal-400/50 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full font-medium text-xs sm:text-sm">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{plan.name}</h3>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-4xl sm:text-5xl font-bold text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="text-base sm:text-lg text-white/60 ml-1">{plan.period}</span>
                  )}
                </div>

                {/* Description */}
                <p className="text-white/70 mb-5 sm:mb-6 text-xs sm:text-sm leading-relaxed min-h-[48px] sm:min-h-[60px]">
                  {plan.description}
                </p>

                {/* CTA Button */}
                <Button
                  onClick={onCTAClick}
                  className={`
                    w-full mb-5 sm:mb-6 rounded-xl font-semibold h-10 sm:h-12 text-sm sm:text-base transition-all duration-300
                    ${
                      plan.popular
                        ? "bg-white text-gray-900 hover:bg-white/90 shadow-lg hover:shadow-xl"
                        : "bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm"
                    }
                  `}
                >
                  {plan.cta}
                </Button>

                {/* Features List */}
                <ul className="space-y-2.5 sm:space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm">
                      <Check
                        className={`h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0 ${
                          plan.popular ? "text-teal-400" : "text-white/60"
                        }`}
                      />
                      <span className="text-white/80 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>


              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
