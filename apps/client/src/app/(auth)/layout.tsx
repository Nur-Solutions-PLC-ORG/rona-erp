import Logo from "@/components/custom/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  return (
    <main className="flex flex-col flex-1 items-center justify-center bg-muted gap-2">
      <Logo className="mb-4" />
      {children}
      <div className="flex items-center justify-center gap-6">
        <Button
          variant={"link"}
          asChild
          className="text-muted-foreground font-normal"
        >
          <Link href={"/terms-of-services"}>Terms of Services</Link>
        </Button>
        <Button
          variant={"link"}
          asChild
          className="text-muted-foreground font-normal"
        >
          <Link href={"/privacy-policy"}>Privacy Policy</Link>
        </Button>
      </div>
    </main>
  );
};

export default Layout;
