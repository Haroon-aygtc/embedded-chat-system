import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

interface CTASectionProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonHref?: string;
  backgroundClass?: string;
}

const CTASection = ({
  title = "Ready to transform your customer interactions?",
  description = "Get started with our context-aware chat system today and provide intelligent, personalized support to your users.",
  primaryButtonText = "Sign up for free",
  secondaryButtonText = "Schedule a demo",
  primaryButtonHref = "/signup",
  secondaryButtonHref = "/demo",
  backgroundClass = "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
}: CTASectionProps) => {
  return (
    <section className={`w-full py-20 ${backgroundClass}`}>
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            {title}
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-3xl mx-auto">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-indigo-600 hover:bg-white/90 font-medium text-lg px-8"
              asChild
            >
              <a href={primaryButtonHref}>
                {primaryButtonText}
                <MessageSquare className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 font-medium text-lg px-8"
              asChild
            >
              <a href={secondaryButtonHref}>
                {secondaryButtonText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
