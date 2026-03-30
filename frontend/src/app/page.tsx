"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuthProvider } from "@/hooks/use-auth";
import BeamGridBackground from "@/components/ui/beam-grid-background";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import SmoothScroll from "@/components/providers/smooth-scroll";

// Priority Imports (Above the fold)
import { Navigation } from "@/modules/Home/components/Navigation";
import { HeroSection } from "@/modules/Home/sections/HeroSection";

// Lazy Loaded Sections (Below the fold)
const SolutionSection = dynamic(() =>
  import("@/modules/Home/sections/SolutionSection").then(
    (m) => m.SolutionSection,
  ),
);
const FeaturesSection = dynamic(() =>
  import("@/modules/Home/sections/FeaturesSection").then(
    (m) => m.FeaturesSection,
  ),
);
const UseCasesSection = dynamic(() =>
  import("@/modules/Home/sections/UseCasesSection").then(
    (m) => m.UseCasesSection,
  ),
);
const PricingSection = dynamic(() =>
  import("@/modules/Home/sections/PricingSection").then(
    (m) => m.PricingSection,
  ),
);
const FAQSection = dynamic(() =>
  import("@/modules/Home/sections/FAQSection").then((m) => m.FAQSection),
);
const Footer = dynamic(() =>
  import("@/modules/Home/components/Footer").then((m) => m.Footer),
);

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthProvider();

  const handleCTA = () => {
    router.push("/dashboard");
  };

  const handleSignUp = () => {
    router.push("/dashboard"); // Defaulting to dashboard for demo context
  };

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-zinc-950">
        <BeamGridBackground
          showFade={false}
          gridColor="#424242"
          darkGridColor="#424242"
          beamColor="rgba(217, 70, 239, 0.8)"
          darkBeamColor="rgba(217, 70, 239, 0.8)"
          interactive={false}
        />
        <div className="relative z-10 w-full overflow-hidden">
          <Navigation isAuthenticated={isAuthenticated} isLoading={isLoading} />
          <HeroSection
            onCTAClick={handleCTA}
            onSignUpClick={handleSignUp}
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
          />
          <SolutionSection />
          <FeaturesSection />
          <UseCasesSection />
          <PricingSection onCTAClick={handleCTA} />
          {/* <FAQSection /> */}
          <Footer />
        </div>
        <ScrollToTop />
      </div>
    </SmoothScroll>
  );
}
