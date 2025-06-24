# Инструкция по тестированию production билда

## 1. Сборка и тест локально (симуляция продакшена)

```bash
# Создаем production билд
npm run build

# Запускаем локально в production режиме
npm start
```

## 2. Тестирование API endpoints

После запуска `npm start` проверьте:

### Базовая проверка:
```
GET http://localhost:3000/api/health
```

### Проверка production конфигурации:
```  
GET http://localhost:3000/api/test/production
```

### Полная проверка с Redis:
```
GET http://localhost:3000/api/test/production?type=full
```

### Тест верификации:
```
POST http://localhost:3000/api/test/production
Content-Type: application/json

{
  "action": "test-verification",
  "email": "test@example.com"
}
```

## 3. Проверка на реальном сервере

После деплоя на only-pc.ru:

### Базовая проверка:
```
GET https://only-pc.ru/api/health
```

### Production тесты:
```
GET https://only-pc.ru/api/test/production
GET https://only-pc.ru/api/test/production?type=full
```

### Тест полного потока:
```
POST https://only-pc.ru/api/test/production
Content-Type: application/json

{
  "action": "test-verification", 
  "email": "ваш-реальный@email.com"
}
```

## 4. Мониторинг логов

На сервере проверьте логи на:
- ✅ `[Storage] Used Redis for storing...` 
- ✅ `[apiUtils] Server-side API call: https://only-pc.ru/api/email`
- ❌ Нет ошибок Redis подключения
- ❌ Нет ошибок `localhost` в URL

## 5. Что проверить в production

1. **Environment variables загружаются корректно**
2. **Redis подключается успешно**  
3. **API calls идут на правильный домен**
4. **Email отправляется через Resend**
5. **Код сохраняется и проверяется**
6. **Fallback работает если Redis недоступен**

## 6. Быстрый тест на продакшене

1. Зайдите на https://only-pc.ru/login
2. Введите email и пароль
3. Проверьте логи браузера (F12 Console)
4. Проверьте, что код приходит на почту
5. Введите код и убедитесь, что вход работает

## 7. Debug URLs для продакшена

- `https://only-pc.ru/api/health` - статус системы
- `https://only-pc.ru/api/test/production` - тесты production
- Логи сервера для детального анализа
