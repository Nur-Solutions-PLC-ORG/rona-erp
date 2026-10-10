import WorkspaceWrapper from "@/modules/workspace/components/wrapper";
import type { Metadata } from "next";

interface Props {
  children?: React.ReactNode;
}

export const metadata: Metadata = { title: "Workspace" };

const Layout = ({ children }: Props) => (
  <WorkspaceWrapper>{children}</WorkspaceWrapper>
);

export default Layout;
