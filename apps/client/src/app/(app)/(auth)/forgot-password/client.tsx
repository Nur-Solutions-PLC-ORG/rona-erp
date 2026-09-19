"use client";

import { ApiPostForgotPassword, ApiPostResetPassword } from "@/api";
import {
  AuthField,
  AuthHeading,
  AuthPasswordInput,
  AUTH_INPUT,
  AUTH_OUTLINE_BUTTON,
  AUTH_PRIMARY_BUTTON,
} from "@/components/custom/auth-form";
import OTP from "@/components/custom/otp";
import { useCreateMutation } from "@/hooks/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { CODE_LENGTH } from "@rona/config/auth";
import { CLIENT_AUTH_SIGNIN_PAGE } from "@rona/routes/auth";
import { ForgotPasswordSchema, ResetPasswordSchema } from "@rona/types/auth";
import { forgotPasswordSchema, resetPasswordSchema } from "@rona/validation/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

const forgotPasswordDefaultValues: ForgotPasswordSchema = {
  email: "",
};

const resetPasswordDefaultValues: ResetPasswordSchema = {
  email: "",
  token: "",
  password: "",
};

type Phase = "request" | "code";

const Client = () => {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("request");
  const [telegramUrl, setTelegramUrl] = useState<string | undefined>();

  const resetPasswordForm = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    reValidateMode: "onSubmit",
    defaultValues: resetPasswordDefaultValues,
  });

  const forgotPasswordForm = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    reValidateMode: "onSubmit",
    defaultValues: forgotPasswordDefaultValues,
  });

  const forgotPasswordMutation = useCreateMutation(
    ApiPostForgotPassword,
    (data) => {
      toast.success(data.message);
      setTelegramUrl(data.data?.telegramUrl);
      setPhase("code");
      resetPasswordForm.setValue("email", forgotPasswordForm.getValues().email);
    },
    (data) => {
      toast.error(data.message);
    },
  );

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

  const onRequestCode = (values: ForgotPasswordSchema) => {
    forgotPasswordMutation.mutate({ body: values });
  };

  const onResetPassword = (values: ResetPasswordSchema) => {
    resetPasswordMutation.mutate({ body: values });
  };

  if (phase === "code") {
    return (
      <div className="space-y-6">
        <AuthHeading
          title="Enter your verification code"
          description="Open the bot with the button below if you have not done it yet, then press Start. Your code will be verified here along with your new password."
        />
        {telegramUrl && (
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={AUTH_PRIMARY_BUTTON}
          >
            Get verification code from Telegram
          </a>
        )}
        <form
          onSubmit={resetPasswordForm.handleSubmit(onResetPassword)}
          className="flex w-full flex-col space-y-5"
        >
          <Controller
            control={resetPasswordForm.control}
            name="token"
            render={({ field, fieldState }) => (
              <AuthField
                label="Verification code"
                htmlFor="verify-code-input"
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
            control={resetPasswordForm.control}
            name="password"
            render={({ field, fieldState }) => (
              <AuthField
                label="New password"
                htmlFor="password-input"
                error={
                  fieldState.invalid
                    ? "Password does not meet requirements"
                    : undefined
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
            {resetPasswordMutation.isPending
              ? "Verifying..."
              : "Verify and reset password"}
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          A code is also sent to your email as a backup.
        </p>
        <Link href={CLIENT_AUTH_SIGNIN_PAGE} className={AUTH_OUTLINE_BUTTON}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AuthHeading
        title="Verify with Telegram"
        description="Enter your email, then tap the button below. Open the bot in Telegram, press Start, and your verification code will be sent to that chat."
      />
      <form
        onSubmit={forgotPasswordForm.handleSubmit(onRequestCode)}
        className="flex w-full flex-col space-y-5"
      >
        <Controller
          control={forgotPasswordForm.control}
          name="email"
          render={({ field, fieldState }) => (
            <AuthField
              label="Email"
              htmlFor="email-input"
              error={fieldState.invalid ? "Invalid email address" : undefined}
            >
              <input
                {...field}
                id="email-input"
                placeholder="you@company.com"
                className={AUTH_INPUT}
                aria-invalid={fieldState.invalid}
              />
            </AuthField>
          )}
        />
        <button
          type="submit"
          disabled={forgotPasswordMutation.isPending}
          className={AUTH_PRIMARY_BUTTON}
        >
          {forgotPasswordMutation.isPending
            ? "Sending..."
            : "Get verification code from Telegram"}
        </button>
      </form>
      <Link href={CLIENT_AUTH_SIGNIN_PAGE} className={AUTH_OUTLINE_BUTTON}>
        Back to sign in
      </Link>
    </div>
  );
};

export default Client;