import { motion } from "framer-motion";
import {
  CogIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

const FeaturesSection = () => {
  const features = [
    {
      icon: CogIcon,
      title: "Умный конфигуратор",
      description:
        "Быстрый подбор комплектующих с учетом совместимости и ваших требований",
    },
    {
      icon: CheckCircleIcon,
      title: "Проверка совместимости",
      description:
        "Система автоматически проверит совместимость всех выбранных компонентов",
    },
    {
      icon: ComputerDesktopIcon,
      title: "Готовые сборки",
      description:
        "Выбирайте из готовых конфигураций, созданных нашими экспертами",
    },
    {
      icon: ShoppingBagIcon,
      title: "Сохранение сборок",
      description:
        "Сохраняйте понравившиеся конфигурации для будущего использования",
    },
  ];

  return (
    <section className="py-20 bg-primary relative overflow-hidden">
      {/* Фоновые элементы */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-32 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-4"
          >
            <CogIcon className="w-8 h-8 text-blue-400" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Почему выбирают OnlyPC
          </h2>
          <p className="text-secondary-light max-w-2xl mx-auto">
            Наш сервис предлагает полный цикл конфигурирования компьютера от
            выбора компонентов до сохранения готовой сборки
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative p-6 rounded-xl bg-gradient-from/10 border border-primary-border hover:border-blue-500/30 hover:bg-gradient-from/20 transition-all duration-300"
            >
              {/* Градиентный верхний край при наведении */}
              <div className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-purple-500/0"></div>
              </div>

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-5 border border-blue-500/30 group-hover:shadow-lg group-hover:shadow-blue-500/10 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-secondary-light group-hover:text-secondary-light/90 transition-colors duration-300">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
