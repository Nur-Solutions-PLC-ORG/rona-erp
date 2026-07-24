import { Metadata } from "next";
import Client from "./not-found-client";

export const metadata: Metadata = {
  title: "Page not Found",
  description: "The page you are looking for doesn't exist.",
};

const Page = () => {
  return <Client />;
};

export default Page;
