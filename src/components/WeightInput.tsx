interface WeightInputProps {
  serviceName: string;
  servicePrice: number;
  serviceLimit: number;
  weightUnit: string;
}

function WeightInput({
  serviceName,
  servicePrice,
  serviceLimit,
  weightUnit,
}: WeightInputProps) {
  return (
    <div>
      <p>{serviceName}</p>
      <div className="flex gap-2 items-center">
        <input
          type="number"
          data-limit="7"
          data-unit="kg"
          className="category-input p-2 text-primary font-bold bg-secondary"
        />
        <p>kg</p>
      </div>
      <p>
        ₱ {servicePrice} per {serviceLimit} {weightUnit}
      </p>
    </div>
  );
}

export default WeightInput;
