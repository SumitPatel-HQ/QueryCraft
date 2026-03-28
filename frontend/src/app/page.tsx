"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import BeamGridBackground from "@/components/ui/beam-grid-background";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import {
  Navigation,
  Footer,
  HeroSection,
  SolutionSection,
  FeaturesSection,
  UseCasesSection,
  PricingSection,
  FAQSection
} from "@/modules/Home/index";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const handleCTA = () => {
    router.push("/dashboard");
  };

  const handleSignUp = () => {
    router.push("/dashboard"); // Defaulting to dashboard for demo context
  };

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-x-hidden">
      <BeamGridBackground 
        showFade={false}
        gridColor="#424242"
        darkGridColor="#424242"
        beamColor="rgba(217, 70, 239, 0.8)"
        darkBeamColor="rgba(217, 70, 239, 0.8)"
        interactive={true}
      />
      <div className="relative z-10 w-full overflow-hidden">
        <Navigation isAuthenticated={isAuthenticated} isLoading={isLoading} />
        <HeroSection onCTAClick={handleCTA} onSignUpClick={handleSignUp} />
        <SolutionSection />
        <FeaturesSection />
        <UseCasesSection />
        <PricingSection onCTAClick={handleCTA} />
        <FAQSection />
        <Footer />
      </div>
      <ScrollToTop />
    </div>
  );
}
