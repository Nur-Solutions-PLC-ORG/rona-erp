import Spinner from "@/components/custom/spinner";

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Spinner className="h-7 w-7 text-zinc-500" />
    </div>
  );
}
