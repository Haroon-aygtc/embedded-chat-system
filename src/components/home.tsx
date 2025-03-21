import React from "react";
import Header from "./layout/Header";
import HeroSection from "./sections/HeroSection";
import FeaturesSection from "./sections/FeaturesSection";
import EmbedOptionsSection from "./sections/EmbedOptionsSection";
import CTASection from "./sections/CTASection";
import Footer from "./layout/Footer";
import ChatWidget from "./chat/ChatWidget";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <EmbedOptionsSection />
        <CTASection />
      </main>
      <Footer />

      {/* Demo Chat Widget */}
      <ChatWidget
        initiallyOpen={false}
        contextMode="restricted"
        contextName="Website Assistance"
        title="ChatEmbed Demo"
        primaryColor="#4f46e5"
      />
    </div>
  );
};

export default Home;
