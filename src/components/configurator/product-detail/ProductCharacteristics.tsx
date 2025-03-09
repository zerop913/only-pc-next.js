import { ProductCharacteristic } from "@/types/product";

interface ProductCharacteristicsProps {
  characteristics?: ProductCharacteristic[];
}

export default function ProductCharacteristics({
  characteristics,
}: ProductCharacteristicsProps) {
  if (!characteristics || characteristics.length === 0) {
    return null;
  }

  // Группируем характеристики по категориям (в данном случае просто делим пополам)
  const midpoint = Math.ceil(characteristics.length / 2);
  const firstGroup = characteristics.slice(0, midpoint);
  const secondGroup = characteristics.slice(midpoint);

  return (
    <div className="mt-8 pt-4 border-t border-primary-border">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
        <span className="inline-block w-1 h-6 bg-blue-500 mr-3 rounded-full"></span>
        Характеристики
      </h2>
      <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
          <div className="space-y-2">
            {firstGroup.map((char, index) => (
              <div
                key={`first-${index}`}
                className="flex justify-between items-center py-2 px-3 border-b border-primary-border/30 last:border-b-0 group hover:bg-gradient-from/20 transition-colors rounded-md"
              >
                <span className="text-secondary-light group-hover:text-secondary-light/90 transition-colors">
                  {char.type}
                </span>
                <span className="text-white font-medium text-right ml-4 group-hover:text-white/90 transition-colors">
                  {char.value}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {secondGroup.map((char, index) => (
              <div
                key={`second-${index}`}
                className="flex justify-between items-center py-2 px-3 border-b border-primary-border/30 last:border-b-0 group hover:bg-gradient-from/20 transition-colors rounded-md"
              >
                <span className="text-secondary-light group-hover:text-secondary-light/90 transition-colors">
                  {char.type}
                </span>
                <span className="text-white font-medium text-right ml-4 group-hover:text-white/90 transition-colors">
                  {char.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
