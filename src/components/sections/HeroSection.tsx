import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, Code, Settings, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  secondaryCtaText?: string;
}

const HeroSection = ({
  title = "Context-Aware AI Chat for Your Website",
  subtitle = "Embed a powerful, customizable chat widget that understands your business context and delivers relevant responses to your users.",
  ctaText = "Get Started",
  secondaryCtaText = "View Demo",
}: HeroSectionProps) => {
  const [showDemo, setShowDemo] = useState(false);

  // Mock chat widget component for demo purposes
  const MockChatWidget = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-blue-600 p-3 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span className="font-medium">AI Assistant</span>
        </div>
        <button className="p-1 rounded-full hover:bg-blue-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div className="h-64 p-4 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg max-w-[80%] self-start">
            <p className="text-sm">Hello! How can I help you today?</p>
          </div>
          <div className="bg-slate-200 dark:bg-slate-700 p-3 rounded-lg max-w-[80%] self-end">
            <p className="text-sm">
              Can you tell me about your context-aware features?
            </p>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg max-w-[80%] self-start">
            <p className="text-sm">
              Our chat system can be configured to understand specific business
              contexts and provide relevant responses based on those contexts.
              This ensures users get information that's specific to your domain!
            </p>
          </div>
        </div>
      </div>
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <section className="w-full py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col space-y-6">
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {title}
            </motion.h1>

            <motion.p
              className="text-xl text-slate-600 dark:text-slate-400 max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {subtitle}
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {ctaText} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowDemo(!showDemo)}
              >
                {secondaryCtaText}
              </Button>
            </motion.div>

            <motion.div
              className="flex items-center gap-8 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Context-Aware</span>
              </div>

              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Easy to Embed</span>
              </div>

              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Fully Customizable</span>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="p-1 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 flex items-center">
              <div className="flex space-x-1.5 ml-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="mx-auto flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="text-xs font-medium">yourwebsite.com</span>
              </div>
            </div>

            <div className="aspect-video bg-slate-50 dark:bg-slate-900 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80"
                  alt="Website preview"
                  className="w-full h-full object-cover opacity-20"
                />

                {/* Demo Chat Widget */}
                <div className="absolute bottom-4 right-4 w-80">
                  {showDemo && <MockChatWidget />}
                  {!showDemo && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-center h-12">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Click "View Demo" to see the chat widget
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
