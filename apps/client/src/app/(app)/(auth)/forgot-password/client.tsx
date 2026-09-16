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
          title="Get your verification code from Telegram"
          description="Tap the button below to open the bot, then press Start in Telegram. Your verification code will be sent to that chat instantly."
        />
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={AUTH_PRIMARY_BUTTON}
        >
          Get verification code from Telegram
        </a>
        <button
          type="button"
          onClick={continueToReset}
          className={AUTH_OUTLINE_BUTTON}
        >
          I have my code — continue
        </button>
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