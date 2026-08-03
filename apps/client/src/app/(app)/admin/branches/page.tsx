import { Metadata } from "next";
import Client from "./client";

export const metadata: Metadata = {
  title: "Branches",
};

const Page = () => {
  return <Client />;
};

export default Page;
