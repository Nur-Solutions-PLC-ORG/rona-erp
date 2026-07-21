import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_PORT } from "@rona/config";

const Page = () => {
  return (
    <div>
      <h1>Welcome to Rona ERP Solutions!</h1>
      <Input placeholder="Input your name" />
      <Button>Button {DEFAULT_PORT}</Button>
    </div>
  );
};

export default Page;
