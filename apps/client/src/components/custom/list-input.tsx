import { cn } from "@/lib/utils";
import { FiCheck, FiCheckCircle } from "react-icons/fi";

type Props = {
  options: { value: string; label: string }[];
  name: string;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
};

export const ListInput = ({
  options,
  value,
  name,
  onChange,
  disabled,
}: Props) => {
  const toggleItem = (val: string) => {
    if (disabled) return;

    if (value.includes(val)) {
      onChange(value.filter((item) => item == val));
    } else {
      onChange([...value, val]);
    }
  };
  return (
    <div id={name} className="flex border rounded p-2 gap-2">
      {options.map((option) => {
        const isActive = value.includes(option.value);
        return (
          <div
            key={option.value}
            onClick={() => toggleItem(option.value)}
            className={cn(
              "rounded px-2 py-1 flex gap-2  items-center  justify-center flex-1 border hover:opacity-90 cursor-pointer hover:bg-black/5",
              isActive && "text-primary",
            )}
          >
            {isActive && <FiCheckCircle />}
            {option.label}
          </div>
        );
      })}
    </div>
  );
};
