import { Metadata } from "next";
import Client from "./client";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Error occurred",
  description: "An error occurred during authentication",
};

const Page = () => {
  return (
    <Suspense>
      <Client />
    </Suspense>
  );
};
export default Page;
