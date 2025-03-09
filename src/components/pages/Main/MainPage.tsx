"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CogIcon,
  FolderIcon,
  ArrowRightIcon,
  SparklesIcon,
  RocketIcon,
  BrainIcon,
  UsersIcon,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

const features = [
  {
    icon: BrainIcon,
    title: "Умный подбор",
    description:
      "Автоматический подбор совместимых комплектующих под ваши задачи и бюджет",
  },
  {
    icon: UsersIcon,
    title: "Опыт сообщества",
    description:
      "Изучайте готовые сборки от опытных пользователей и получайте советы",
  },
  {
    icon: SparklesIcon,
    title: "Простота выбора",
    description:
      "Понятный интерфейс и подробные описания помогут разобраться даже новичку",
  },
];

const PageBackground = () => (
  <div className="fixed inset-0 bg-gradient-to-br from-[#0E0F18] to-[#1D1E2C] z-[-1]" />
);

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block mb-6"
        >
          <div className="bg-gradient-to-r from-gradient-from/20 to-gradient-to/20 rounded-full p-2 pl-3 pr-4 border border-primary-border backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-gradient-to" />
              <span className="text-secondary-light">
                Умный подбор комплектующих
              </span>
            </div>
          </div>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl font-bold text-white mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Создайте идеальный ПК
          <br />
          для Ваших задач
        </motion.h1>

        <motion.p
          className="text-xl text-secondary max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Простой и удобный конфигуратор поможет собрать компьютер, который
          будет соответствовать именно вашим потребностям
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative inline-block group"
        >
          <motion.div className="absolute inset-0 bg-gradient-to-r from-gradient-from/50 to-gradient-to/50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <button
            onClick={() => (window.location.href = "/configurator")}
            className="relative px-8 py-4 text-lg bg-gradient-to-r from-gradient-from to-gradient-to rounded-full text-white font-semibold hover:from-gradient-hover-from hover:to-gradient-hover-to transition-all duration-300"
          >
            Собрать компьютер
          </button>
        </motion.div>
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  return (
    <section className="relative min-h-screen flex items-center">
      <div className="container relative mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-block mb-6"
            animate={{
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-gradient-from to-gradient-to rounded-2xl flex items-center justify-center">
              <SparklesIcon className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Почему выбирают OnlyPC?
          </h2>
          <p className="text-secondary text-xl max-w-2xl mx-auto">
            Мы создали удобный инструмент, который поможет вам собрать идеальный
            компьютер
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="relative group cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onMouseEnter={() => setActiveFeature(index)}
                onMouseLeave={() => setActiveFeature(null)}
              >
                <div className="relative p-8 rounded-3xl bg-gradient-from/20 border border-primary-border backdrop-blur-sm">
                  <div className="relative z-10">
                    <div className="bg-gradient-to-br from-gradient-from to-gradient-to p-4 rounded-2xl inline-block mb-6">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>

                    <motion.h3
                      className="text-2xl font-bold text-white mb-4"
                      animate={{
                        color: activeFeature === index ? "#ffffff" : "#9D9EA6",
                      }}
                    >
                      {feature.title}
                    </motion.h3>

                    <motion.p
                      className="text-secondary text-lg leading-relaxed"
                      animate={{
                        opacity: activeFeature === index ? 1 : 0.8,
                      }}
                    >
                      {feature.description}
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const cards = [
    {
      id: "configurator",
      icon: CogIcon,
      title: "Создайте свою сборку",
      subtitle: "Конфигуратор ПК",
      description:
        "Используйте наш умный конфигуратор для создания идеальной сборки под ваши задачи",
      features: [
        "Умный подбор комплектующих",
        "Проверка совместимости",
        "Оптимизация под бюджет",
      ],
      href: "/configurator",
    },
    {
      id: "builds",
      icon: FolderIcon,
      title: "Готовые решения",
      subtitle: "Каталог сборок",
      description:
        "Выберите из множества готовых конфигураций от опытных пользователей",
      features: [
        "Проверенные сборки",
        "Отзывы пользователей",
        "Разные ценовые категории",
      ],
      href: "/builds",
    },
  ];

  return (
    <section className="relative min-h-screen flex items-center">
      <div className="container relative mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-block mb-6"
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1.1, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-gradient-from to-gradient-to rounded-2xl flex items-center justify-center">
                <RocketIcon className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Готовы начать?
            </h2>
            <p className="text-secondary text-xl max-w-2xl mx-auto">
              Выберите подходящий вариант и начните создавать свой идеальный
              компьютер
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {cards.map((card) => (
              <motion.div
                key={card.id}
                className="relative group cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => (window.location.href = card.href)}
              >
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D1E2C] to-[#252736] hover:from-[#22243A] hover:to-[#2A2C44] transition-all duration-300">
                  <div className="relative p-8">
                    <div className="flex items-start gap-6 mb-8">
                      <motion.div
                        className="bg-primary-dark/30 p-4 rounded-2xl"
                        animate={{
                          scale: hoveredCard === card.id ? 1.1 : 1,
                        }}
                      >
                        <card.icon className="w-8 h-8 text-white" />
                      </motion.div>

                      <div>
                        <motion.div
                          className="text-sm text-secondary-light mb-1"
                          animate={{
                            opacity: hoveredCard === card.id ? 1 : 0.8,
                          }}
                        >
                          {card.subtitle}
                        </motion.div>
                        <motion.h3
                          className="text-2xl font-bold text-white"
                          animate={{
                            scale: hoveredCard === card.id ? 1.05 : 1,
                          }}
                        >
                          {card.title}
                        </motion.h3>
                      </div>
                    </div>

                    <p className="text-secondary-light text-lg mb-6 transition-opacity duration-200">
                      {card.description}
                    </p>

                    <motion.div
                      className="space-y-3"
                      animate={{
                        opacity: hoveredCard === card.id ? 1 : 0.7,
                      }}
                    >
                      {card.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center gap-3"
                          initial={{ x: 0 }}
                          animate={{
                            x: hoveredCard === card.id ? 5 : 0,
                          }}
                          transition={{
                            duration: 0.2,
                            delay: index * 0.1,
                          }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary-light" />
                          <span className="text-secondary-light">
                            {feature}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>

                    <motion.div
                      className="absolute bottom-8 right-8 bg-primary-dark/30 p-3 rounded-full"
                      animate={{
                        x: hoveredCard === card.id ? 10 : 0,
                        scale: hoveredCard === card.id ? 1.1 : 1,
                      }}
                    >
                      <ArrowRightIcon className="w-6 h-6 text-white" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default function HomePage() {
  return (
    <div className="bg-gradient-to-br from-[#0E0F18] to-[#1D1E2C]">
      <PageBackground />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}
