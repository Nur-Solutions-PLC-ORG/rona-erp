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
  children?: React.ReactNode;
  headerClassName?: string;
  footer?: React.ReactNode;
};

const CardWrapper = ({
  title,
  titleClassName,
  description,
  children,
  footer,
  headerClassName,
}: Props) => {
  return (
    <Card className="min-w-100">
      <CardHeader className={cn(headerClassName)}>
        <CardTitle className={cn(titleClassName)}>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
};

export default CardWrapper;
