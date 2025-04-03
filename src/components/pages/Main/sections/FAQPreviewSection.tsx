import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

const FAQPreviewSection = () => {
  const [hoveredQuestion, setHoveredQuestion] = useState<number | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const previewQuestions = [
    {
      question: "Как начать работу с конфигуратором?",
      answer:
        "Перейдите в раздел 'Конфигуратор' и начните выбирать комплектующие. Система поможет вам с совместимостью.",
    },
    {
      question: "Нужна ли регистрация?",
      answer:
        "Базовые функции доступны без регистрации, но для сохранения конфигураций необходим аккаунт.",
    },
    {
      question: "Как проверяется совместимость?",
      answer:
        "Наша система автоматически проверяет совместимость всех компонентов в реальном времени.",
    },
  ];

  const toggleQuestion = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  return (
    <section className="relative py-24 bg-gradient-to-b from-primary-dark to-primary overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary to-transparent"></div>
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/3 rounded-full blur-3xl"></div>
      <div className="absolute top-1/3 -left-32 w-64 h-64 bg-purple-500/3 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 opacity-5">
        <ChatBubbleLeftRightIcon className="w-64 h-64 text-purple-400" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-4"
            >
              <QuestionMarkCircleIcon className="w-8 h-8 text-blue-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Остались вопросы?
            </h2>
            <p className="text-secondary-light">
              Найдите ответы на самые популярные вопросы
            </p>
          </motion.div>

          <div className="space-y-4 mb-8">
            {previewQuestions.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`border rounded-xl overflow-hidden transition-all duration-300 
                  ${
                    expandedQuestion === index
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
                      expandedQuestion === index
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
                          expandedQuestion === index
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
                          hoveredQuestion === index ||
                          expandedQuestion === index
                            ? "text-blue-400"
                            : "text-secondary-light"
                        } 
                        ${expandedQuestion === index ? "rotate-180" : ""}
                      `}
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {expandedQuestion === index && (
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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center"
          >
            <Link href="/faq">
              <button className="px-6 py-3 bg-gradient-from/10 hover:bg-gradient-from/20 rounded-lg text-secondary-light font-medium border border-primary-border hover:text-white transition-all duration-300 flex items-center gap-2 mx-auto group">
                <span>Все вопросы и ответы</span>
                <ChevronRightIcon className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQPreviewSection;
