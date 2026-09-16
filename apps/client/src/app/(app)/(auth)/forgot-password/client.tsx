"use client";

import { ApiPostForgotPassword } from "@/api";
import {
  AuthField,
  AuthHeading,
  AUTH_INPUT,
  AUTH_OUTLINE_BUTTON,
  AUTH_PRIMARY_BUTTON,
} from "@/components/custom/auth-form";
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
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

const defaultValues: ForgotPasswordSchema = {
  email: "",
};

const Client = () => {
  const router = useRouter();
  const [telegramUrl, setTelegramUrl] = useState<string | undefined>();

  const forgotPasswordMutation = useCreateMutation(
    ApiPostForgotPassword,
    (data) => {
      toast.success(data.message);
      setTelegramUrl(data.data?.telegramUrl);

      if (!data.data?.telegramUrl) {
        router.push(
          `${CLIENT_AUTH_RESET_PASSWORD_PAGE}?email=${encodeURIComponent(form.getValues().email)}`,
        );
      }
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    reValidateMode: "onSubmit",
    defaultValues,
  });

  const onSubmit = (values: ForgotPasswordSchema) => {
    forgotPasswordMutation.mutate({ body: values });
  };

  const continueToReset = () => {
    router.push(
      `${CLIENT_AUTH_RESET_PASSWORD_PAGE}?email=${encodeURIComponent(form.getValues().email)}`,
    );
  };

  if (telegramUrl) {
    return (
      <div className="space-y-6">
        <AuthHeading
          title="Check your Telegram"
          description="We also sent a code to your email. To get the reset code on Telegram, open the bot with the button below and press Start — your code will be sent to that chat."
        />
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={AUTH_PRIMARY_BUTTON}
        >
          Get code on Telegram
        </a>
        <button
          type="button"
          onClick={continueToReset}
          className={AUTH_OUTLINE_BUTTON}
        >
          I have the code — enter it
        </button>
        <Link href={CLIENT_AUTH_SIGNIN_PAGE} className={AUTH_OUTLINE_BUTTON}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AuthHeading
        title="Forgot password"
        description="Enter your email and a reset code will be sent to your email."
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
          {forgotPasswordMutation.isPending ? "Sending..." : "Send reset token"}
        </button>
      </form>
      <Link href={CLIENT_AUTH_SIGNIN_PAGE} className={AUTH_OUTLINE_BUTTON}>
        Back to sign in
      </Link>
    </div>
  );
};

export default Client;