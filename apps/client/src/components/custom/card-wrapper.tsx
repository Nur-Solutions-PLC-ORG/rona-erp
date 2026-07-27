import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { cn } from "@/lib/utils";
import Logo from "./logo";
import { Button } from "../ui/button";
import Link from "next/link";

type Props = {
  title: string;
  titleClassName?: string;
  description?: string;
  descriptionClassName?: string;
  children?: React.ReactNode;
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
  footer,
  headerClassName,
  className,
  center = false,
}: Props) => {
  return (
    <Card className={cn("w-full max-w-92", className)}>
      <CardHeader className={cn(headerClassName)}>
        <CardTitle
          className={cn(
            center && "text-center font-bold text-xl my-2",
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
      {children && <CardContent>{children}</CardContent>}
      {footer && <CardFooter className="flex flex-col">{footer}</CardFooter>}
    </Card>
  );
};

interface CardWrapperParentProps {
  children: React.ReactNode;
  className?: string;
  includeLogo?: boolean;
  includeLegals?: boolean;
  isLoading?: boolean;
}

export const CardWrapperParent = ({
  children,
  className,
  includeLogo = true,
  includeLegals = true,
  isLoading = false,
}: CardWrapperParentProps) => {
  return (
    <main
      className={cn(
        "flex flex-col flex-1 items-center justify-center bg-muted gap-2",
        className,
      )}
    >
      {isLoading ? (
        <>
          <Logo black className="animate-pulse opacity-5" />
        </>
      ) : (
        <>
          {includeLogo && <Logo className="mb-4" />}
          {children}
          {includeLegals && (
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
          )}
        </>
      )}
    </main>
  );
};

export default CardWrapper;
