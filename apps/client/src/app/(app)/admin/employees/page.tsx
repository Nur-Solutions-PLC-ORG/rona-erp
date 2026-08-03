import { Metadata } from "next";
import Client from "./client";

export const metadata: Metadata = {
  title: "Employees",
};

const Page = () => {
  return <Client />;
};

export default Page;
