import { motion } from "framer-motion";
import Link from "next/link";
import {
  CogIcon,
  ChevronRightIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const CallToAction = () => {
  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Фоновые элементы */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:40px_40px] opacity-[0.02]"></div>
        <div className="absolute top-0 right-0 h-px w-1/3 bg-gradient-to-l from-blue-500/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 h-px w-1/3 bg-gradient-to-r from-blue-500/30 to-transparent"></div>
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gradient-from/5 backdrop-blur-sm border border-primary-border/70">
            {/* Декоративные световые элементы */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
            <div className="absolute top-12 left-0 bottom-12 w-[1px] bg-gradient-to-b from-transparent via-blue-500/20 to-transparent"></div>
            <div className="absolute top-12 right-0 bottom-12 w-[1px] bg-gradient-to-b from-transparent via-purple-500/20 to-transparent"></div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-b from-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>

            <div className="p-8 md:p-12 relative">
              <div className="md:flex items-center gap-8">
                {/* Левая анимированная часть */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100,
                    damping: 12,
                  }}
                  className="mb-8 md:mb-0 md:flex-shrink-0"
                >
                  <div className="relative mx-auto md:mx-0 w-40 h-40 md:w-48 md:h-48">
                    {/* Внутренний круг */}
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500/20 via-purple-500/30 to-blue-500/20 backdrop-blur-sm border border-blue-500/30"></div>

                    {/* Внешний кольцевой орбита */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-dashed"
                    ></motion.div>

                    {/* Орбитальная точка 1 */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0"
                    >
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500/30 rounded-full backdrop-blur-sm border border-blue-500/60"></div>
                    </motion.div>

                    {/* Орбитальная точка 2 */}
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0"
                    >
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-purple-500/40 rounded-full backdrop-blur-sm border border-purple-500/60"></div>
                    </motion.div>

                    {/* Центр */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CogIcon className="w-16 h-16 text-blue-400" />
                    </div>
                  </div>
                </motion.div>

                {/* Правая текстовая часть */}
                <div className="text-center md:text-left flex-1">
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight"
                  >
                    Готовы собрать свой идеальный компьютер?
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-secondary-light mb-8"
                  >
                    Наш конфигуратор поможет вам создать оптимальную систему под
                    ваши задачи и бюджет. Дизайн, производительность, цена — всё
                    под контролем.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="flex flex-col sm:flex-row items-center sm:items-start gap-4 justify-center md:justify-start"
                  >
                    <Link href="/configurator">
                      <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 flex items-center gap-2 group">
                        <span>Перейти к конфигуратору</span>
                        <ArrowRightIcon className="w-4 h-4 transition-all duration-300 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0" />
                      </button>
                    </Link>
                    <Link href="/catalog">
                      <button className="w-full sm:w-auto px-6 py-4 bg-gradient-from/10 hover:bg-gradient-from/20 rounded-lg text-secondary-light hover:text-white font-medium border border-primary-border transition-all duration-300">
                        Готовые сборки
                      </button>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
