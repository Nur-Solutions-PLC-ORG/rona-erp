import { cn } from "@/lib/utils";
import { IoCheckmarkDone } from "react-icons/io5";

type Props = {
  options: { value: string; label: string }[];
  name: string;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  viewMode?: boolean;
};

export const ListInput = ({
  options,
  value,
  name,
  onChange,
  disabled,
  viewMode,
}: Props) => {
  const toggleItem = (val: string) => {
    if (disabled) return;

    if (value.includes(val)) {
      onChange(value.filter((item) => item !== val));
    } else {
      onChange([...value, val]);
    }
  };
  const processedOptions = viewMode
    ? options.filter((item) => value.includes(item.value))
    : options;

  return (
    <div className="flex flex-col">
      <div
        id={name}
        className={cn(
          "grid grid-cols-2 border bg-black/2 rounded-lg p-2 gap-2",
          disabled && "opacity-80",
        )}
      >
        {processedOptions.map((option) => {
          const isActive = value.includes(option.value);
          return (
            <div
              key={option.value}
              onClick={() => toggleItem(option.value)}
              className={cn(
                "rounded-lg px-2 bg-card py-0.5 flex gap-2 items-center flex-1 border ",
                isActive && "text-primary font-semibold",
                !disabled &&
                  "hover:opacity-90 cursor-pointer hover:bg-black/5 active:scale-105 transition-all",
              )}
            >
              {option.label}
              {isActive && <IoCheckmarkDone className="size-4 ml-auto" />}
            </div>
          );
        })}

        {processedOptions.length <= 0 && (
          <span className="px-2 opacity-50">None</span>
        )}
      </div>
      {!viewMode && (
        <span className="text-sm opacity-50 mt-2">Click to select</span>
      )}
    </div>
  );
};
