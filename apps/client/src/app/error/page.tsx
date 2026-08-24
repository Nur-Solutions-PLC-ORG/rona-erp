import { Metadata } from "next";
import Client from "./client";
import { Suspense } from "react";
import LoaderPage from "@/components/custom/loader-page";

export const metadata: Metadata = {
  title: "Error Occurred",
  description: "An Error occurred during the use of this application",
};

const Page = () => {
  return (
    <Suspense fallback={<LoaderPage />}>
      <Client />
    </Suspense>
  );
};
export default Page;
