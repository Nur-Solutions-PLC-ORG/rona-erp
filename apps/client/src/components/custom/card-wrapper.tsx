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
    <Card className={cn("min-w-120", className)}>
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

export default CardWrapper;
