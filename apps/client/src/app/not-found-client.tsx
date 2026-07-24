import CardWrapper, {
  CardWrapperParent,
} from "@/components/custom/card-wrapper";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Client = () => {
  return (
    <CardWrapperParent>
      <CardWrapper
        title="404: Page not Found"
        description="The Page your are looking for doesn't exist"
        footer={
          <>
            <Button asChild className="w-full" variant={"outline"}>
              <Link href={"/sign-in"}>Back to sign in</Link>
            </Button>
          </>
        }
      ></CardWrapper>
    </CardWrapperParent>
  );
};

export default Client;
