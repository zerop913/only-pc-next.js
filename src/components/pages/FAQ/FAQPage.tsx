"use client";

import { useState } from "react";
import FAQSection from "./FAQSection";
import { motion, AnimatePresence } from "framer-motion";
import {
  CircuitBoard,
  ShoppingCart,
  CreditCard,
  Truck,
  HelpCircle,
  Users,
} from "lucide-react";

const sections = [
  {
    id: "general",
    title: "Общие вопросы",
    icon: HelpCircle,
    items: [
      {
        question: "Что такое OnlyPC?",
        answer:
          "OnlyPC - это онлайн-платформа для создания и подбора компьютерных конфигураций. Мы помогаем пользователям собрать оптимальный компьютер под их потребности, проверяя совместимость всех компонентов и предлагая лучшие варианты по соотношению цена/качество.",
      },
      {
        question: "Как начать работу с конфигуратором?",
        answer:
          "Начать работу с конфигуратором очень просто: перейдите в раздел 'Конфигуратор', выберите необходимые комплектующие из предложенных категорий. Система автоматически проверит совместимость компонентов и поможет вам создать оптимальную сборку.",
      },
      {
        question: "Нужна ли регистрация для использования сайта?",
        answer:
          "Базовые функции сайта доступны без регистрации, но для сохранения конфигураций, добавления товаров в избранное и получения персональных рекомендаций необходимо создать аккаунт.",
      },
    ],
  },
  {
    id: "components",
    title: "Комплектующие",
    icon: CircuitBoard,
    items: [
      {
        question: "Как проверяется совместимость компонентов?",
        answer:
          "Наша система автоматически проверяет совместимость всех компонентов по множеству параметров: сокет процессора, форм-фактор материнской платы, мощность блока питания, совместимость RAM и многое другое. Вы получаете уведомления о любых потенциальных проблемах совместимости.",
      },
      {
        question: "Как узнать характеристики компонента?",
        answer:
          "На странице каждого компонента представлены подробные технические характеристики, фотографии и описание. Также доступны отзывы пользователей и рекомендации по использованию.",
      },
      {
        question: "Почему некоторые компоненты недоступны?",
        answer:
          "Компоненты могут быть временно недоступны по различным причинам: отсутствие на складе, несовместимость с уже выбранными компонентами или прекращение производства. Мы всегда предлагаем альтернативные варианты замены.",
      },
    ],
  },
  {
    id: "orders",
    title: "Заказы и оплата",
    icon: ShoppingCart,
    items: [
      {
        question: "Какие способы оплаты доступны?",
        answer:
          "Мы поддерживаем различные способы оплаты: банковские карты (Visa, MasterCard, МИР), электронные кошельки, банковский перевод. Все платежи проходят через защищенные каналы связи.",
      },
      {
        question: "Как отследить статус заказа?",
        answer:
          "После оформления заказа вы получите уведомление на email. В личном кабинете вы можете отслеживать статус заказа в реальном времени, получать уведомления об изменениях и связываться с менеджером.",
      },
    ],
  },
  {
    id: "shipping",
    title: "Доставка",
    icon: Truck,
    items: [
      {
        question: "Какие способы доставки доступны?",
        answer:
          "Мы предлагаем несколько вариантов доставки: курьерская доставка по городу, доставка в пункты выдачи, почтовая доставка по России. Сроки и стоимость зависят от выбранного способа и вашего местоположения.",
      },
      {
        question: "Как происходит доставка компьютера?",
        answer:
          "Собранные компьютеры упаковываются в специальную защитную тару с амортизацией. Доставка осуществляется специализированной службой, которая имеет опыт работы с хрупкими грузами.",
      },
    ],
  },
  {
    id: "account",
    title: "Личный кабинет",
    icon: Users,
    items: [
      {
        question: "Как изменить личные данные?",
        answer:
          "В личном кабинете перейдите в раздел 'Настройки профиля'. Там вы можете изменить контактную информацию, пароль и настройки уведомлений.",
      },
      {
        question: "Где посмотреть сохраненные конфигурации?",
        answer:
          "Все ваши сохраненные конфигурации доступны в разделе 'Мои сборки' личного кабинета. Вы можете редактировать их, делиться с другими пользователями или использовать как основу для новых сборок.",
      },
    ],
  },
  {
    id: "payment",
    title: "Оплата",
    icon: CreditCard,
    items: [
      {
        question: "Безопасно ли оплачивать онлайн?",
        answer:
          "Да, все платежи проходят через защищенные каналы связи с использованием современных протоколов шифрования. Мы работаем только с проверенными платежными системами.",
      },
      {
        question: "Какие гарантии вы предоставляете?",
        answer:
          "На все комплектующие распространяется гарантия производителя. Дополнительно мы предоставляем гарантию на сборку и настройку компьютера в течение 12 месяцев.",
      },
    ],
  },
];

export default function FAQPage() {
  const [activeSection, setActiveSection] = useState("general");

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-primary rounded-xl p-6 border border-primary-border">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Часто задаваемые вопросы
          </h1>
          <p className="text-secondary-light text-sm">
            Найдите ответы на самые распространенные вопросы о нашем сервисе
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`relative p-6 rounded-xl border transition-all duration-300
                  ${
                    activeSection === section.id
                      ? "bg-gradient-to-b from-blue-500/10 to-blue-600/5 border-blue-500/30"
                      : "bg-gradient-from/20 border-primary-border hover:bg-gradient-from/30"
                  }`}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div
                    className={`p-3 rounded-lg transition-colors duration-300
                      ${
                        activeSection === section.id
                          ? "bg-blue-500/10"
                          : "bg-gradient-from/30"
                      }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        activeSection === section.id
                          ? "text-blue-400"
                          : "text-secondary-light"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      activeSection === section.id
                        ? "text-white"
                        : "text-secondary-light"
                    }`}
                  >
                    {section.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {sections.map(
            (section) =>
              activeSection === section.id && (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <FAQSection items={section.items} />
                </motion.div>
              )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
