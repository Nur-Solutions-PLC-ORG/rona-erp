import { Metadata } from "next";
import Client from "./client";

export const metadata: Metadata = {
  title: "Reset password",
};

const Page = () => {
  return <Client />;
};

export default Page;
