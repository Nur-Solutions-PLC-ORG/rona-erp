import { CardWrapperParent } from "@/components/custom/card-wrapper";

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  return <CardWrapperParent>{children}</CardWrapperParent>;
};

export default Layout;
