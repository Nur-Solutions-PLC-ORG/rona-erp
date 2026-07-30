import { Metadata } from "next";
import Client from "./client";

export const metadata: Metadata = {
  title: "Forgot password",
};

const Page = () => {
  return <Client />;
};

export default Page;
