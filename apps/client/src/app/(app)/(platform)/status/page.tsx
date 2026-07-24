import { Metadata } from "next";
import Client from "./client";

export const metadata: Metadata = {
  title: "Status",
  description: "The server and system status",
};

const Page = () => {
  return <Client />;
};

export default Page;
