"use client";

import { ApiPostForgotPassword } from "@/api";
import CardWrapper from "@/components/custom/card-wrapper";
import CustomButton from "@/components/custom/custom-button";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCreateMutation } from "@/hooks/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CLIENT_AUTH_RESET_PASSWORD_PAGE,
  CLIENT_AUTH_SIGNIN_PAGE,
} from "@rona/routes/auth";
import { ForgotPasswordSchema } from "@rona/types/auth";
import { forgotPasswordSchema } from "@rona/validation/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

const defaultValues: ForgotPasswordSchema = {
  email: "",
};

const Client = () => {
  const router = useRouter();

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    reValidateMode: "onSubmit",
    defaultValues,
  });

  const forgotPasswordMutation = useCreateMutation(
    ApiPostForgotPassword,
    (data) => {
      toast.success(data.message);
      router.push(CLIENT_AUTH_RESET_PASSWORD_PAGE);
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const onSubmit = (values: ForgotPasswordSchema) => {
    forgotPasswordMutation.mutate({ body: values });
  };

  return (
    <CardWrapper center title={"Forgot Password"}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5 w-full flex flex-col"
      >
        <FieldGroup className="gap-5">
          <p className="text-muted-foreground">
            Enter your email and password resent token will be sent.
          </p>
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="email-input">Email</FieldLabel>
                <Input
                  {...field}
                  id="email-input"
                  aria-invalid={fieldState.invalid}
                  placeholder="email@gmail.com"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
        <CustomButton
          isPending={forgotPasswordMutation.isPending}
          size={"lg"}
          className="w-full"
        >
          Send
        </CustomButton>
        <Button asChild variant={"outline"} className="w-full">
          <Link href={CLIENT_AUTH_SIGNIN_PAGE}>Back to Sign in</Link>
        </Button>
      </form>
    </CardWrapper>
  );
};

export default Client;
