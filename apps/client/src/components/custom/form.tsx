import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  column?: number;
};

export const ControllerGroup = ({ children, column = 2 }: Props) => {
  return (
    <div
      style={{
        gridTemplateColumns: `repeat(${column}, minmax(0, 1fr))`,
      }}
      className={cn("grid gap-6")}
    >
      {children}
    </div>
  );
};
