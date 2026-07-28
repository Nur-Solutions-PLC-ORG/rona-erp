import { Metadata } from "next";
import Client from "./client";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Error Occurred",
  description: "An Error occurred during the use of this application",
};

const Page = () => {
  return (
    <Suspense>
      <Client />
    </Suspense>
  );
};
export default Page;
