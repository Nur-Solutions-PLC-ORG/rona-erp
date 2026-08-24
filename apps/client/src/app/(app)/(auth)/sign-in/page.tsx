import { Metadata } from "next";
import Client from "./client";
import { Suspense } from "react";
import LoaderPage from "@/components/custom/loader-page";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Rona account",
};

const Page = () => {
  return (
    <Suspense fallback={<LoaderPage />}>
      <Client />
    </Suspense>
  );
};

export default Page;
