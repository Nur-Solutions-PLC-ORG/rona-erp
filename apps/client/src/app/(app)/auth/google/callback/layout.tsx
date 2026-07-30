import LoaderPage from "@/components/custom/loader-page";

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  return (
    <>
      <LoaderPage />
      {children}
    </>
  );
};

export default Layout;
