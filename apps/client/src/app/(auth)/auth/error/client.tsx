"use client";

import CardWrapper from "@/components/custom/card-wrapper";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const Client = () => {
  const params = useSearchParams();
  const errorMessage =
    params.get("message") ||
    "An error occurred while trying to sign in. Please try again later.";

  return (
    <CardWrapper
      footer={
        <>
          <Button asChild className="w-full" variant={"outline"}>
            <Link href={"/sign-in"}>Back to sign in</Link>
          </Button>
        </>
      }
      title="Sign in error occurred"
      titleClassName="text-red-800"
      description={errorMessage}
      descriptionClassName="sr-only"
    >
      <p>{errorMessage}</p>
    </CardWrapper>
  );
};

export default Client;
