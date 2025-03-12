import { motion } from "framer-motion";
import {
  ComputerDesktopIcon,
  CpuChipIcon,
  CircleStackIcon,
  ServerStackIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";

export default function ConfiguratorWelcome() {
  const features = [
    {
      icon: <CpuChipIcon className="w-6 h-6" />,
      title: "Подбор комплектующих",
      description: "Широкий выбор современных компонентов",
    },
    {
      icon: <CircleStackIcon className="w-6 h-6" />,
      title: "Проверка совместимости",
      description: "Автоматическая проверка компонентов",
    },
    {
      icon: <ServerStackIcon className="w-6 h-6" />,
      title: "Сборка компьютера",
      description: "Профессиональная сборка вашего ПК",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      {/* Основная секция с инструкцией */}
      <div className="flex items-center justify-center mb-6 pt-6">
        <ArrowUpIcon className="w-5 h-5 text-blue-400 animate-bounce mr-2" />
        <span className="text-secondary-light text-sm">
          Выберите категорию для начала работы
        </span>
      </div>

      {/* Секция с преимуществами */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-gradient-from/10 rounded-lg p-4 border border-primary-border/30 hover:border-primary-border/50 hover:bg-gradient-from/20 transition-all duration-300"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-2 bg-gradient-from/20 rounded-lg border border-primary-border/30">
                <div className="text-blue-400">{feature.icon}</div>
              </div>
              <div>
                <h3 className="text-white text-sm font-medium mb-1">
                  {feature.title}
                </h3>
                <p className="text-secondary-light text-sm">
                  {feature.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Краткая инструкция */}
      <div className="mt-6 p-4 bg-gradient-from/10 rounded-lg border border-primary-border/30">
        <div className="flex items-center gap-3 mb-3">
          <ComputerDesktopIcon className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-medium">
            Как пользоваться конфигуратором
          </h3>
        </div>
        <ul className="space-y-2 text-sm text-secondary-light">
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-from/20 border border-primary-border/30 text-xs text-blue-400">
              1
            </span>
            <span>Выберите категорию компонентов из списка выше</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-from/20 border border-primary-border/30 text-xs text-blue-400">
              2
            </span>
            <span>Используйте фильтры для поиска нужных комплектующих</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-from/20 border border-primary-border/30 text-xs text-blue-400">
              3
            </span>
            <span>Добавляйте компоненты в вашу сборку</span>
          </li>
        </ul>
      </div>
    </motion.div>
  );
}
