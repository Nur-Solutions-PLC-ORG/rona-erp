import AdminWrapper from "@/modules/admin/components/wrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin · Rona",
  },
};

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  return <AdminWrapper>{children}</AdminWrapper>;
};

export default Layout;
