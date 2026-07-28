"use client";

import CardWrapper, {
  CardWrapperParent,
} from "@/components/custom/card-wrapper";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const Client = () => {
  const params = useSearchParams();
  const errorMessage =
    params.get("message") ||
    "An Error occurred during the operation. Please try again later.";

  return (
    <CardWrapperParent>
      <CardWrapper
        center
        title="Error Encountered"
        titleClassName="text-red-900"
        description={errorMessage}
        descriptionClassName="sr-only"
      >
        <p className="text-center">{errorMessage}</p>
        <Button asChild className="w-full" variant={"outline"}>
          <Link href={"/"}>Back to Home</Link>
        </Button>
      </CardWrapper>
    </CardWrapperParent>
  );
};

export default Client;
