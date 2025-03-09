interface TotalPriceProps {
  total: number;
}

const TotalPrice = ({ total }: TotalPriceProps) => {
  return (
    <div className="w-full md:w-auto md:text-right">
      <h3 className="text-secondary-dark text-sm font-semibold mb-1">
        Стоимость сборки
      </h3>
      <p className="text-white text-lg font-bold">
        {total.toLocaleString("ru-RU", {
          style: "currency",
          currency: "RUB",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
      </p>
    </div>
  );
};

export default TotalPrice;
