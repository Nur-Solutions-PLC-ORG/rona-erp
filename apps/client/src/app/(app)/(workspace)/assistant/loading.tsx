import { Skeleton } from "@/components/custom/skeleton";
import { Card } from "@/modules/workspace/components/ui";

const RonaAiLoading = () => (
  <div className="space-y-4">
    <Card className="rounded-lg px-6 py-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-3 w-72 rounded" />
        </div>
      </div>
    </Card>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[74px] rounded-lg" />
      ))}
    </div>
    <div className="grid items-start gap-4 lg:grid-cols-3">
      <Skeleton className="h-64 rounded-lg lg:col-span-2" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
    <Card className="rounded-lg px-4 py-4">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="h-20 w-full rounded" />
      </div>
    </Card>
  </div>
);

export default RonaAiLoading;
