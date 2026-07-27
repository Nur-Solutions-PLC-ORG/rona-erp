import AppWrapper from "@/modules/app/components/wrapper";

interface Props {
  children?: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return <AppWrapper>{children}</AppWrapper>;
};
export default Layout;
