"use client";

import { ApiPostResetPassword } from "@/api";
import {
  AuthField,
  AuthHeading,
  AuthPasswordInput,
  AUTH_INPUT,
  AUTH_PRIMARY_BUTTON,
} from "@/components/custom/auth-form";
import OTP from "@/components/custom/otp";
import { useCreateMutation } from "@/hooks/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { CODE_LENGTH } from "@rona/config/auth";
import { CLIENT_AUTH_SIGNIN_PAGE } from "@rona/routes/auth";
import { ResetPasswordSchema } from "@rona/types/auth";
import { resetPasswordSchema } from "@rona/validation/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

const Client = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("email") ?? "";

  const defaultValues: ResetPasswordSchema = {
    email: prefillEmail,
    token: "",
    password: "",
  };

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
    resetPasswordMutation.mutate({ body: values });
  };

  return (
    <div className="space-y-6">
      <AuthHeading
        title="Reset password"
        description="A reset code was sent to your Telegram and email. Enter it below along with a new password."
      />
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col space-y-5"
      >
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <AuthField
              label="Email"
              htmlFor="email-input"
              error={
                fieldState.invalid ? "Invalid email address" : undefined
              }
            >
              <input
                {...field}
                id="email-input"
                type="email"
                placeholder="you@company.com"
                className={AUTH_INPUT}
                aria-invalid={fieldState.invalid}
              />
            </AuthField>
          )}
        />
        <Controller
          control={form.control}
          name="token"
          render={({ field, fieldState }) => (
            <AuthField
              label="Reset code"
              htmlFor="token-input"
              error={
                fieldState.invalid
                  ? "Enter the code from your Telegram or email"
                  : undefined
              }
            >
              <OTP {...field} length={CODE_LENGTH} />
            </AuthField>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <AuthField
              label="New password"
              htmlFor="password-input"
              error={
                fieldState.invalid ? "Password does not meet requirements" : undefined
              }
            >
              <AuthPasswordInput
                {...field}
                id="password-input"
                aria-invalid={fieldState.invalid}
              />
            </AuthField>
          )}
        />
        <button
          type="submit"
          disabled={resetPasswordMutation.isPending}
          className={AUTH_PRIMARY_BUTTON}
        >
          {resetPasswordMutation.isPending ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </div>
  );
};

export default Client;
