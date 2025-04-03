"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CogIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import InteractiveConfigurator from "../interactive/InteractiveConfigurator";

const ConfiguratorPreview = () => {
  return (
    <section className="py-20 bg-primary-dark overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex-1"
          >
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="px-3 py-1 rounded-full bg-gradient-from/20 text-blue-400 text-sm border border-blue-500/30">
                  Удобный процесс
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Умный конфигуратор компьютера
              </h2>
              <p className="text-lg text-secondary-light mb-6">
                Конфигуратор поможет собрать компьютер по вашим требованиям с
                оптимальным соотношением цены и производительности.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  "Интуитивно понятный интерфейс",
                  "Моментальная проверка совместимости",
                  "Рекомендации по выбору компонентов",
                  "Сохранение сборок в личном кабинете",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <CheckCircleIcon className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-secondary-light">{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/configurator">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 flex items-center gap-2">
                  <CogIcon className="w-5 h-5" />
                  <span>Перейти к конфигуратору</span>
                </button>
              </Link>
            </div>
          </motion.div>

          <div className="flex-1 relative h-[450px] flex items-center justify-center">
            <InteractiveConfigurator />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConfiguratorPreview;
