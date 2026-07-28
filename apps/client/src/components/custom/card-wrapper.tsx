import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import Logo from "./logo";
import LoaderPage from "./loader-page";

type Props = {
  title: string;
  titleClassName?: string;
  description?: string;
  descriptionClassName?: string;
  children?: React.ReactNode;
  containerClassName?: string;
  headerClassName?: string;
  footer?: React.ReactNode;
  className?: string;
  center?: boolean;
};

const CardWrapper = ({
  title,
  titleClassName,
  description,
  descriptionClassName,
  children,
  containerClassName,
  footer,
  headerClassName,
  className,
  center = false,
}: Props) => {
  return (
    <div className={cn("w-full max-w-80 space-y-6 rounded", className)}>
      <CardHeader className={cn("gap-3", headerClassName)}>
        <CardTitle
          className={cn(
            "font-medium text-4xl tracking-tight",
            center && "text-center",
            titleClassName,
          )}
        >
          {title}
        </CardTitle>
        <CardDescription
          className={cn(center && "text-center", descriptionClassName)}
        >
          {description}
        </CardDescription>
      </CardHeader>
      {children && (
        <CardContent
          className={cn(
            center && "flex flex-col items-center justify-center gap-6",
            containerClassName,
          )}
        >
          {children}
        </CardContent>
      )}
      {footer && (
        <CardFooter className="flex flex-col relative">
          <div className="w-full flex flex-col z-10">{footer}</div>
        </CardFooter>
      )}
    </div>
  );
};

interface CardWrapperParentProps {
  children: React.ReactNode;
  className?: string;
  includeLogo?: boolean;
  includeLegals?: boolean;
  isLoading?: boolean;
  centered?: boolean;
}

export const CardWrapperParent = ({
  children,
  className,
  includeLogo = true,
  includeLegals = true,
  isLoading = false,
  centered = true,
}: CardWrapperParentProps) => {
  const LINKS = (
    <div className="flex items-center justify-center gap-3">
      <Button
        variant={"link"}
        asChild
        className="text-muted-foreground font-normal h-7"
      >
        <Link href={"/help"}>Help</Link>
      </Button>
      <Button
        variant={"link"}
        asChild
        className="text-muted-foreground font-normal h-7"
      >
        <Link href={"/terms-of-services"}>Terms</Link>
      </Button>
      <Button
        variant={"link"}
        asChild
        className="text-muted-foreground font-normal h-7"
      >
        <Link href={"/privacy-policy"}>Privacy</Link>
      </Button>
    </div>
  );

  if (isLoading) {
    return <LoaderPage />;
  }

  return (
    <main
      className={cn(
        "flex flex-col flex-1 items-center justify-center gap-10",
        className,
      )}
    >
      {centered ? (
        <>
          {includeLogo && <Logo />}
          {children}
          {includeLegals && (
            <div className="flex items-center justify-between border-t pt-4">
              {LINKS}
            </div>
          )}
        </>
      ) : (
        <></>
      )}
    </main>
  );
};

export default CardWrapper;
