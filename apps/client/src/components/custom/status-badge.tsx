import { BADGE_COLORS } from "@/lib/colors";
import { cn } from "@/lib/utils";

type BadgeColor = keyof typeof BADGE_COLORS;

const STATUS_COLORS: Record<string, BadgeColor> = {
  active: "green",
  invited: "yellow",
  suspended: "red",
  inactive: "gray",
  resigned: "gray",
  on_leave: "yellow",
  terminated: "gray",
  archived: "gray",

  CLOCK_IN: "green",
  CLOCK_OUT: "gray",
  BREAK_START: "yellow",
  BREAK_END: "blue",

  QUARANTINED: "yellow",
  APPROVED: "green",
  REJECTED: "red",
  RELEASED: "green",
  EXPIRED: "gray",

  CONSUMED: "gray",

  RECEIPT: "green",
  ISSUE: "blue",
  TRANSFER: "gray",
  RETURN: "yellow",
  ADJUSTMENT: "gray",

  DRAFT: "gray",
  RETIRED: "gray",

  PLANNED: "blue",
  IN_PROGRESS: "blue",
  COMPLETED: "green",
  CANCELLED: "red",

  REVIEWED: "gray",

  PASS: "green",
  FAIL: "red",
  RELEASE: "green",
  REJECT: "red",
};

const STATUS_LABELS: Record<string, string> = {
  on_leave: "On Leave",
  archived: "Archived",
  CLOCK_IN: "Clock In",
  CLOCK_OUT: "Clock Out",
  BREAK_START: "Break Start",
  BREAK_END: "Break End",
  QUARANTINED: "Quarantined",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RELEASED: "Released",
  EXPIRED: "Expired",
  CONSUMED: "Consumed",

  RECEIPT: "Receipt",
  ISSUE: "Issue",
  TRANSFER: "Transfer",
  RETURN: "Return",
  ADJUSTMENT: "Adjustment",

  DRAFT: "Draft",
  RETIRED: "Retired",
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REVIEWED: "Reviewed",
  PASS: "Pass",
  FAIL: "Fail",
  RELEASE: "Release",
  REJECT: "Reject",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const color = BADGE_COLORS[STATUS_COLORS[status] ?? "gray"];
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
      style={{
        color,
        backgroundColor: `${color}1a`,
        borderColor: `${color}33`,
      }}
    >
      {label}
    </span>
  );
}
