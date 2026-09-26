import Spinner from "@/components/custom/spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner className="h-6 w-6 text-zinc-400" />
    </div>
  );
}
