import { motion } from "framer-motion";
import Link from "next/link";
import {
  CheckCircleIcon,
  ComputerDesktopIcon,
  ChevronRightIcon,
  ServerIcon,
  DeviceTabletIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

const BuildTypesSection = () => {
  const buildTypes = [
    {
      title: "Игровые ПК",
      description:
        "Мощные системы для современных игр с высокой производительностью",
      icon: ComputerDesktopIcon,
      color: "from-blue-500/20 to-indigo-500/20",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-400",
      hoverGlow: "group-hover:shadow-blue-500/10",
    },
    {
      title: "Рабочие станции",
      description:
        "Оптимизированные компьютеры для профессиональных задач и работы",
      icon: ServerIcon,
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      iconColor: "text-purple-400",
      hoverGlow: "group-hover:shadow-purple-500/10",
    },
    {
      title: "Компактные системы",
      description:
        "Небольшие, но производительные компьютеры для экономии пространства",
      icon: DeviceTabletIcon,
      color: "from-emerald-500/20 to-teal-500/20",
      borderColor: "border-emerald-500/30",
      iconColor: "text-emerald-400",
      hoverGlow: "group-hover:shadow-emerald-500/10",
    },
  ];

  return (
    <section className="py-20 bg-primary-dark relative overflow-hidden">
      {/* Фоновые элементы */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-primary to-transparent"></div>
        <div className="absolute -top-24 right-[20%] w-80 h-80 bg-blue-500/3 rounded-full blur-[80px]"></div>
        <div className="absolute top-1/2 left-[30%] w-96 h-96 bg-purple-500/3 rounded-full blur-[100px]"></div>
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
            <RocketLaunchIcon className="w-8 h-8 text-blue-400" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Типы компьютерных сборок
          </h2>
          <p className="text-secondary-light max-w-2xl mx-auto">
            Выбирайте готовые решения или создавайте собственные конфигурации
            под ваши задачи
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {buildTypes.map((type, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group rounded-xl overflow-hidden bg-gradient-from/10 border border-primary-border hover:border-opacity-70 hover:bg-gradient-from/20 transition-all duration-300"
            >
              <div className="px-6 pt-8 pb-4">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center ${type.borderColor} border group-hover:shadow-lg ${type.hoverGlow} transition-all duration-300`}
                  >
                    <type.icon className={`w-8 h-8 ${type.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-medium text-white group-hover:text-blue-300 transition-colors duration-300">
                    {type.title}
                  </h3>
                </div>

                <p className="text-secondary-light mb-6 leading-relaxed">
                  {type.description}
                </p>

                <div className="space-y-3 mb-8">
                  {[
                    "Оптимальный подбор компонентов",
                    "Гарантированная совместимость",
                    "Баланс цены и производительности",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <CheckCircleIcon className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span className="text-sm text-secondary-light group-hover:text-secondary-light/90 transition-colors">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-primary-border/30 group-hover:border-blue-500/10">
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors group/link"
                >
                  <span>Посмотреть сборки</span>
                  <ChevronRightIcon className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BuildTypesSection;
