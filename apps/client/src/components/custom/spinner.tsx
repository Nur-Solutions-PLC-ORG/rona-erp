import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  label?: string;
}

const Spinner = ({ className, label = "Loading…" }: SpinnerProps) => {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center justify-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className={cn("animate-spin text-current", className ?? "h-5 w-5")}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
};

export default Spinner;
