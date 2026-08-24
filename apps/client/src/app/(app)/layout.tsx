import LoaderPage from "@/components/custom/loader-page";
import AppWrapper from "@/modules/app/components/wrapper";
import { Suspense } from "react";

interface Props {
  children?: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <Suspense fallback={<LoaderPage />}>
      <AppWrapper>{children}</AppWrapper>
    </Suspense>
  );
};
export default Layout;
