import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title: string;
  items: FAQItem[];
}

const FAQSection = ({ title, items }: FAQSectionProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [hoveredQuestion, setHoveredQuestion] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`border rounded-xl overflow-hidden transition-all duration-300 
              ${
                expandedIndex === index
                  ? "bg-gradient-from/20 border-blue-500/30 shadow-lg shadow-blue-500/5"
                  : "bg-gradient-from/10 border-primary-border hover:bg-gradient-from/15"
              }
            `}
            onMouseEnter={() => setHoveredQuestion(index)}
            onMouseLeave={() => setHoveredQuestion(null)}
          >
            <button
              className="w-full text-left p-6 flex items-center justify-between"
              onClick={() => toggleQuestion(index)}
            >
              <h3
                className={`font-medium ${
                  expandedIndex === index
                    ? "text-white"
                    : "text-secondary-light"
                }`}
              >
                {item.question}
              </h3>

              <div className="w-8 h-8 relative flex items-center justify-center">
                <div
                  className={`
                    absolute inset-0 rounded-full transition-colors duration-300
                    ${
                      expandedIndex === index
                        ? "bg-blue-500/20 border border-blue-500/30"
                        : hoveredQuestion === index
                        ? "bg-gradient-from/20 border border-primary-border"
                        : "bg-transparent border border-transparent"
                    }
                  `}
                />
                <ChevronDownIcon
                  className={`
                    relative z-10 w-5 h-5 transition-all duration-300 
                    ${
                      hoveredQuestion === index || expandedIndex === index
                        ? "text-blue-400"
                        : "text-secondary-light"
                    } 
                    ${expandedIndex === index ? "rotate-180" : ""}
                  `}
                />
              </div>
            </button>

            <AnimatePresence>
              {expandedIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6">
                    <div className="h-px w-full bg-primary-border/50 mb-6"></div>
                    <div className="flex">
                      <div className="w-1 bg-gradient-to-b from-blue-500/30 to-purple-500/30 rounded-full mr-4 flex-shrink-0"></div>
                      <p className="text-secondary-light">{item.answer}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;
