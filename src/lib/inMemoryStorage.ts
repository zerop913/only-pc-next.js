// Fallback in-memory storage для кодов верификации
// Используется когда Redis недоступен
interface VerificationCode {
  code: string;
  expiresAt: number;
}

class InMemoryVerificationStorage {
  private storage = new Map<string, VerificationCode>();

  set(email: string, code: string, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.storage.set(email, { code, expiresAt });
    console.log(
      `[InMemory] Stored verification code for ${email}, expires at ${new Date(expiresAt).toISOString()}`
    );
    return Promise.resolve();
  }

  get(email: string): Promise<string | null> {
    const entry = this.storage.get(email);
    if (!entry) {
      console.log(`[InMemory] No code found for ${email}`);
      return Promise.resolve(null);
    }

    // Проверяем, не истек ли код
    if (Date.now() > entry.expiresAt) {
      console.log(`[InMemory] Code expired for ${email}`);
      this.storage.delete(email);
      return Promise.resolve(null);
    }

    console.log(`[InMemory] Retrieved code for ${email}`);
    return Promise.resolve(entry.code);
  }

  delete(email: string): Promise<void> {
    this.storage.delete(email);
    console.log(`[InMemory] Deleted code for ${email}`);
    return Promise.resolve();
  }

  ping(): Promise<string> {
    return Promise.resolve("PONG");
  }

  // Очистка истекших кодов
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [email, entry] of this.storage.entries()) {
      if (now > entry.expiresAt) {
        this.storage.delete(email);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[InMemory] Cleaned up ${cleaned} expired codes`);
    }
  }

  // Получение статистики
  getStats(): { total: number; active: number } {
    const now = Date.now();
    let active = 0;
    for (const entry of this.storage.values()) {
      if (now <= entry.expiresAt) {
        active++;
      }
    }
    return {
      total: this.storage.size,
      active,
    };
  }
}

// Глобальный экземпляр
let inMemoryStorage: InMemoryVerificationStorage | null = null;

export function getInMemoryStorage(): InMemoryVerificationStorage {
  if (!inMemoryStorage) {
    inMemoryStorage = new InMemoryVerificationStorage();

    // Запускаем периодическую очистку каждые 5 минут
    if (typeof globalThis !== "undefined") {
      setInterval(
        () => {
          inMemoryStorage?.cleanup();
        },
        5 * 60 * 1000
      );
    }
  }
  return inMemoryStorage;
}

export default InMemoryVerificationStorage;
