export interface CompatibilityIssue {
  rule_id: number;
  rule_name: string;
  message: string;
  primary_char?: string;
  primary_value?: string;
  secondary_char?: string;
  secondary_value?: string;
  severity: "error" | "warning" | "info";
}

export interface ProductCompatibilityInfo {
  id: number;
  title: string;
  category_id: number;
  category_name: string;
}

export interface ComponentCompatibilityResult {
  compatible: boolean;
  issues: CompatibilityIssue[];
  primary_product?: ProductCompatibilityInfo;
  secondary_product?: ProductCompatibilityInfo;
}

export interface BuildCompatibilityResult {
  compatible: boolean;
  results: ComponentCompatibilityResult[];
}

export interface ComponentWithCategory {
  categorySlug: string;
  productSlug: string;
}

export interface CompatibilityRuleType {
  id: number;
  name: string;
  description?: string;
}

export interface CompatibilityRuleCategory {
  id: number;
  rule_id: number;
  primary_category_id: number;
  secondary_category_id: number;
}

export interface CompatibilityRuleCharacteristic {
  id: number;
  rule_id: number;
  primary_characteristic_id: number;
  secondary_characteristic_id: number;
  comparison_type:
    | "exact_match"
    | "compatible_values"
    | "contains"
    | "greater_than_or_equal"
    | "greater_than_or_equal_combined"
    | "frequency_match"
    | "backward_compatible"
    | "exists"
    | "greater_than_zero"
    | "less_than_or_equal"
    | "power_sufficient";
}

export interface CompatibilityValue {
  id: number;
  rule_characteristic_id: number;
  primary_value: string;
  secondary_value: string;
}

export interface CompatibilityCheckResult {
  id: number;
  buildId: number;
  isCompatible: boolean;
  issues: string;
  createdAt: string;
  updatedAt: string;
}

// Компонент для проверки совместимости
export interface Component {
  slug: string;
  categorySlug: string;
}

// Узел компонента для графа совместимости
export interface ComponentNode {
  id: number;
  categorySlug: string;
  productSlug: string;
  title: string;
  categoryName: string;
}

// Связь между компонентами для проверки совместимости
export interface CompatibilityEdge {
  source: ComponentNode;
  target: ComponentNode;
  compatible: boolean;
  reason: string | null;
}

// Проблема совместимости между компонентами (используется в CompabilityResult)
export interface CompatibilityPairIssue {
  components: {
    id: number;
    title: string;
    category: string;
  }[];
  reason: string;
}

// Результат проверки совместимости
export interface CompatibilityResult {
  compatible: boolean;
  issues: CompatibilityPairIssue[];
  componentPairs: CompatibilityEdge[];
}
