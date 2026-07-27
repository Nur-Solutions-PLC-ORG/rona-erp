"use client";

import CardWrapper from "@/components/custom/card-wrapper";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const Client = () => {
  const params = useSearchParams();
  const errorMessage =
    params.get("message") ||
    "An Error occurred while trying to sign in to your account. Please try again later.";

  return (
    <CardWrapper
      center
      title="Sign in Error"
      titleClassName="text-red-900"
      description={errorMessage}
      descriptionClassName="sr-only"
    >
      <p className="text-center">{errorMessage}</p>
      <Button asChild className="w-full" variant={"outline"}>
        <Link href={"/sign-in"}>Back to sign in</Link>
      </Button>
    </CardWrapper>
  );
};

export default Client;
