import { Metadata } from "next";
import Client from "./client";

export const metadata: Metadata = {
  title: "Signin",
  description: "Signin to your Rona account",
};

const Page = () => {
  return <Client />;
};

export default Page;
