import { motion } from "framer-motion";
import Link from "next/link";
import {
  CpuChipIcon,
  ComputerDesktopIcon,
  ServerIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";

const HeroSection = () => {
  return (
    <section className="relative py-24 md:py-32 bg-primary overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] rounded-full bg-blue-500/2 blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-purple-500/2 blur-[100px] translate-x-1/2 translate-y-1/2"></div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute top-36 left-0 h-px w-full bg-gradient-to-r from-transparent via-blue-500/10 to-transparent transform origin-left"
        ></motion.div>
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-0 left-1/4 h-full w-px bg-gradient-to-b from-transparent via-blue-500/10 to-transparent transform origin-top"
        ></motion.div>
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut", delay: 0.8 }}
          className="absolute top-0 left-3/4 h-full w-px bg-gradient-to-b from-transparent via-purple-500/10 to-transparent transform origin-top"
        ></motion.div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-8 px-4 py-1.5 rounded-full border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm"
          >
            <span className="text-sm text-blue-400">
              Создайте компьютер своей мечты
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-8 tracking-tight leading-tight"
          >
            Удобный{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              конфигуратор
            </span>{" "}
            для сборки ПК
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg text-secondary-light mb-10 max-w-2xl mx-auto"
          >
            Интеллектуальная система выбора компонентов с проверкой
            совместимости. Соберите оптимальную систему под ваши задачи
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/configurator">
              <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                Начать конфигурацию
              </button>
            </Link>
            <Link href="/catalog">
              <button className="w-full sm:w-auto px-8 py-4 bg-gradient-from/10 rounded-lg text-secondary-light font-medium border border-primary-border hover:bg-gradient-from/20 hover:text-white transition-all duration-300">
                Готовые решения
              </button>
            </Link>
          </motion.div>

          <div className="hidden md:block relative h-36 mt-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-48 h-32"
            >
              <div className="absolute inset-0 border border-blue-500/20 rounded-lg"></div>
              <div className="absolute left-4 top-4 right-4 bottom-4 border border-blue-500/30 rounded-lg bg-gradient-from/10"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <ComputerDesktopIcon className="w-12 h-12 text-blue-400/40" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9 }}
              className="absolute left-1/2 -translate-x-1/2 top-0 w-36 h-36"
            >
              <div className="absolute inset-0 border border-purple-500/20 rounded-full"></div>
              <div className="absolute left-3 top-3 right-3 bottom-3 border border-purple-500/30 rounded-full bg-gradient-from/10"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <CpuChipIcon className="w-12 h-12 text-purple-400/40" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-32"
            >
              <div className="absolute inset-0 border border-blue-500/20 rounded-lg"></div>
              <div className="absolute left-4 top-4 right-4 bottom-4 border border-blue-500/30 rounded-lg bg-gradient-from/10"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <ServerIcon className="w-12 h-12 text-blue-400/40" />
              </div>
            </motion.div>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, delay: 1.1 }}
              className="absolute top-1/2 left-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
            ></motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="absolute bottom-[-40px] left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="flex flex-col items-center text-secondary-light"
            >
              <div className="text-xs uppercase tracking-wider mb-2">
                Узнать больше
              </div>
              <ArrowDownIcon className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
