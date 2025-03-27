import React, { useEffect, useState } from "react";
import Header from "./layout/Header";
import HeroSection from "./sections/HeroSection";
import FeaturesSection from "./sections/FeaturesSection";
import EmbedOptionsSection from "./sections/EmbedOptionsSection";
import CTASection from "./sections/CTASection";
import Footer from "./layout/Footer";
import ChatWidget from "./chat/ChatWidget";
import { widgetConfigService } from "@/services/widgetConfigService";

interface WidgetConfig {
  initiallyOpen: boolean;
  contextMode: "restricted" | "open" | "custom";
  contextName: string;
  title: string;
  primaryColor: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  showOnMobile?: boolean;
}

const Home = () => {
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    initiallyOpen: false,
    contextMode: "restricted",
    contextName: "Website Assistance",
    title: "ChatEmbed Demo",
    primaryColor: "#4f46e5",
    position: "bottom-right",
    showOnMobile: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWidgetConfig();
  }, []);

  const fetchWidgetConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch widget configuration from MySQL
      try {
        const defaultConfig =
          await widgetConfigService.getDefaultWidgetConfig();

        if (defaultConfig) {
          setWidgetConfig({
            initiallyOpen: defaultConfig.initiallyOpen || false,
            contextMode: defaultConfig.contextMode || "restricted",
            contextName: defaultConfig.contextName || "Website Assistance",
            title: defaultConfig.title || "ChatEmbed Demo",
            primaryColor: defaultConfig.primaryColor || "#4f46e5",
            position: defaultConfig.position || "bottom-right",
            showOnMobile:
              defaultConfig.showOnMobile !== undefined
                ? defaultConfig.showOnMobile
                : true,
          });
        }
      } catch (dbError) {
        console.error("Error fetching widget config from database:", dbError);
        setError("Failed to load widget configuration from database");
      }
    } catch (error) {
      console.error("Error fetching widget config:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

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

      {error && (
        <div className="fixed bottom-4 right-4 bg-destructive text-white p-4 rounded-md shadow-lg">
          {error}
        </div>
      )}

      {/* Chat Widget */}
      {!loading && !error && (
        <ChatWidget
          initiallyOpen={widgetConfig.initiallyOpen}
          contextMode={widgetConfig.contextMode}
          contextName={widgetConfig.contextName}
          title={widgetConfig.title}
          primaryColor={widgetConfig.primaryColor}
          position={widgetConfig.position}
          showOnMobile={widgetConfig.showOnMobile}
        />
      )}
    </div>
  );
};

export default Home;
