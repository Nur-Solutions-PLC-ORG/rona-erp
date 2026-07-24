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
}: Props) => {
  return (
    <Card className={cn("min-w-100 max-w-110", className)}>
      <CardHeader className={cn(headerClassName)}>
        <CardTitle className={cn(titleClassName)}>{title}</CardTitle>
        <CardDescription className={cn(descriptionClassName)}>
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
}

export const CardWrapperParent = ({
  children,
  className,
  includeLogo = true,
  includeLegals = true,
}: CardWrapperParentProps) => {
  return (
    <main
      className={cn(
        "flex flex-col flex-1 items-center justify-center bg-muted gap-2",
        className,
      )}
    >
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
    </main>
  );
};

export default CardWrapper;
