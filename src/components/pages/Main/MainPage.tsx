"use client";

import HeroSection from "./sections/HeroSection";
import FeaturesSection from "./sections/FeaturesSection";
import ConfiguratorPreview from "./sections/ConfiguratorPreview";
import BuildTypesSection from "./sections/BuildTypesSection";
import FAQPreviewSection from "./sections/FAQPreviewSection";
import CallToAction from "./sections/CallToAction";

const MainPage = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <ConfiguratorPreview />
      <BuildTypesSection />
      <FAQPreviewSection />
      <CallToAction />
    </div>
  );
};

export default MainPage;
