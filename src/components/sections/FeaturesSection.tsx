import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Code, Shield, Settings, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description = "" }: FeatureCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col items-start h-full"
    >
      <div className="p-3 bg-primary/10 rounded-lg mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
    </motion.div>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: <MessageSquare className="h-6 w-6 text-primary" />,
      title: "Context-Aware Responses",
      description:
        "Intelligent chat system that understands business context and provides relevant answers based on configured domains.",
    },
    {
      icon: <Code className="h-6 w-6 text-primary" />,
      title: "Flexible Embedding Options",
      description:
        "Easily integrate the chat widget into any website using iframe or Web Component (Shadow DOM) embedding methods.",
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Secure & Private",
      description:
        "Enterprise-grade security with data encryption, authentication, and compliance with privacy regulations.",
    },
    {
      icon: <Settings className="h-6 w-6 text-primary" />,
      title: "Comprehensive Admin Controls",
      description:
        "Powerful admin dashboard for managing context rules, prompt templates, and monitoring chat analytics.",
    },
    {
      icon: <Layers className="h-6 w-6 text-primary" />,
      title: "AI-Powered Intelligence",
      description:
        "Leverages advanced AI models from Gemini and Hugging Face to deliver accurate and helpful responses.",
    },
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Powerful Features for Intelligent Conversations
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Our embeddable chat system combines advanced AI capabilities with
            flexible configuration options to deliver exceptional user
            experiences.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Button size="lg" className="mr-4">
              Explore Features
            </Button>
            <Button variant="outline" size="lg">
              View Documentation
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
