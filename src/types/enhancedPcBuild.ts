import { PcBuildResponse } from "./pcbuild";

// Категории сборок для фильтрации
export type BuildCategory = "gaming" | "workstation" | "office" | "all";

// Расширенный интерфейс для сборки ПК с дополнительными свойствами для страницы каталога
export interface EnhancedPcBuild extends PcBuildResponse {
  category?: BuildCategory;
  viewCount?: number;
  performanceScore?: number;
  featured?: boolean;
}
