import { Metadata } from "next";
import Client from "./client";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Rona account",
};

const Page = () => {
  return <Client />;
};

export default Page;
