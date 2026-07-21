import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_PORT } from "@rona/config";

const Page = () => {
  return (
    <div>
      <Input />
      <Button>Button {DEFAULT_PORT}</Button>
    </div>
  );
};

export default Page;
