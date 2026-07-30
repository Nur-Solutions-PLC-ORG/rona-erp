"use client";

import { ApiPostResetPassword } from "@/api";
import CardWrapper from "@/components/custom/card-wrapper";
import CustomButton from "@/components/custom/custom-button";
import OTP from "@/components/custom/otp";
import PasswordInput from "@/components/custom/password-input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useCreateMutation } from "@/hooks/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { CODE_LENGTH } from "@rona/config/auth";
import { CLIENT_AUTH_SIGNIN_PAGE } from "@rona/routes/auth";
import { ResetPasswordSchema } from "@rona/types/auth";
import { resetPasswordSchema } from "@rona/validation/auth";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

const defaultValues: ResetPasswordSchema = {
  token: "",
  password: "",
};

const Client = () => {
  const router = useRouter();

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    reValidateMode: "onSubmit",
    defaultValues,
  });

  const resetPasswordMutation = useCreateMutation(
    ApiPostResetPassword,
    (data) => {
      toast.success(data.message);

      router.push(CLIENT_AUTH_SIGNIN_PAGE);
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const onSubmit = (values: ResetPasswordSchema) => {
    resetPasswordMutation.mutate(values);
  };

  return (
    <CardWrapper center title={"Reset Password"}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5 w-full flex flex-col"
      >
        <FieldGroup className="gap-5">
          <p className="text-muted-foreground">
            Please input your reset token sent to your email and your new
            password.
          </p>
          <Controller
            control={form.control}
            name="token"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="token-input">Reset Token</FieldLabel>
                <OTP {...field} length={CODE_LENGTH} />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password-input">New Password</FieldLabel>
                <PasswordInput
                  {...field}
                  id="password-input"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
        <CustomButton
          isPending={resetPasswordMutation.isPending}
          size={"lg"}
          className="w-full"
        >
          Reset
        </CustomButton>
      </form>
    </CardWrapper>
  );
};

export default Client;
