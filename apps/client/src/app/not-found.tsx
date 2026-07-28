import CardWrapper, {
  CardWrapperParent,
} from "@/components/custom/card-wrapper";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not Found",
  description: "The page you are looking for doesn't exist.",
};

const Page = () => {
  return (
    <CardWrapperParent>
      <CardWrapper
        center
        title="404: Page not Found"
        description="The Page your are looking for doesn't exist"
        footer={
          <>
            <Button asChild className="w-full" variant={"outline"}>
              <Link href={"/"}>Back to home</Link>
            </Button>
          </>
        }
      ></CardWrapper>
    </CardWrapperParent>
  );
};

export default Page;
