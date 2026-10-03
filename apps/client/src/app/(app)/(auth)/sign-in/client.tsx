"use client";

import {
  ApiGetGoogleUrl,
  ApiGetSessionStatus,
  ApiPostChangePassword,
  ApiPostResendVerificationCode,
  ApiPostSignIn,
  TryCatchNullWrap,
} from "@/api";
import {
  AuthDivider,
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
import { CODE_LENGTH, OPT_RESEND_DELAY_DURATION_MS } from "@rona/config/auth";
import { CLIENT_APP_LAUNCHER_PAGE } from "@rona/routes/app";
import { CLIENT_AUTH_FORGOT_PASSWORD_PAGE } from "@rona/routes/auth";
import { ResendVerificationCodeSchema, SignInSchema } from "@rona/types/auth";
import { signInSchema } from "@rona/validation/auth";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

const defaultValues: SignInSchema = {
  email: "",
  password: "",
};

const getSafeRedirectPath = (redirectPath: string | null) => {
  if (
    !redirectPath ||
    !redirectPath.startsWith("/") ||
    redirectPath.startsWith("//")
  ) {
    return null;
  }

  return redirectPath;
};

const Client = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const redirectPath =
    getSafeRedirectPath(searchParams.get("redirect")) ??
    CLIENT_APP_LAUNCHER_PAGE;

  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    reValidateMode: "onSubmit",
    defaultValues,
  });

  const [tFAEnabled, setTFAEnabled] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [changeEmail, setChangeEmail] = useState("");
  const [changeCurrentPassword, setChangeCurrentPassword] = useState("");
  const [changeNewPassword, setChangeNewPassword] = useState("");
  const [changeConfirmPassword, setChangeConfirmPassword] = useState("");
  const [changeErrors, setChangeErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const emailValue = useWatch({ control: form.control, name: "email" });

  const googleMutation = useCreateMutation(
    ApiGetGoogleUrl,
    (data) => {
      if (data.data) {
        router.push(data.data);
        toast.info("Redirecting...");
      }
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const signInMutation = useCreateMutation(
    ApiPostSignIn,
    async (data) => {
      toast.success(data.message);

      if (data.data && data.data.mustChangePassword) {
        setChangeEmail(form.getValues("email"));
        setChangeCurrentPassword(form.getValues("password"));
        setMustChangePassword(true);
        form.reset(defaultValues);
      } else if (data.data && data.data.tfaEnabled) {
        setTFAEnabled(true);
        setResendIn(60);
      } else {
        const session = await queryClient.fetchQuery({
          queryKey: ["auth-session"],
          queryFn: TryCatchNullWrap(ApiGetSessionStatus),
        });

        if (session?.success) {
          router.replace(redirectPath);
        }
      }
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const resendVerificationCodeMutation = useCreateMutation(
    ApiPostResendVerificationCode,
    (data) => {
      toast.success(data.message);
      setResendIn(OPT_RESEND_DELAY_DURATION_MS / 1000);
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const changePasswordMutation = useCreateMutation(
    ApiPostChangePassword,
    (data) => {
      toast.success(data.message);
      setMustChangePassword(false);
      setChangeEmail("");
      setChangeCurrentPassword("");
      setChangeNewPassword("");
      setChangeConfirmPassword("");
      setChangeErrors({});
      form.reset(defaultValues);
    },
    (data) => {
      toast.error(data.message);
    },
  );

  useEffect(() => {
    const intervalID = setInterval(() => {
      if (resendIn !== 0) {
        setResendIn(resendIn - 1);
      }
    }, 1000);

    return () => clearInterval(intervalID);
  }, [resendIn]);

  const handleContinueWithGoogleClick = async () => {
    googleMutation.mutate({ searchParams: { redirect: redirectPath } });
  };

  const onSubmit = (values: SignInSchema) => {
    const body: typeof values = {
      email: values.email,
      password: values.password,
      ...(tFAEnabled ? { code: values.code } : {}),
    };

    if (tFAEnabled && !values.code) {
      toast.info("Please enter the verification code sent to your email.");
      return;
    }

    signInMutation.mutate({ body });
  };

  const onChangePasswordSubmit = () => {
    setChangeErrors({});

    if (changeNewPassword.length < 8) {
      setChangeErrors((prev) => ({
        ...prev,
        newPassword: "Password must be at least 8 characters long",
      }));
      return;
    }

    if (changeNewPassword !== changeConfirmPassword) {
      setChangeErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
      return;
    }

    changePasswordMutation.mutate({
      body: {
        email: changeEmail,
        currentPassword: changeCurrentPassword,
        newPassword: changeNewPassword,
      },
    });
  };

  return (
    <div className="space-y-6">
      <AuthHeading
        title={
          mustChangePassword
            ? "Set your password"
            : tFAEnabled
              ? "Verify your sign in"
              : "Sign in to Rona"
        }
        description={
          mustChangePassword
            ? "Your account requires a new password. Please set a secure password to continue."
            : tFAEnabled
              ? "We sent a verification code to your email address."
              : "Welcome back. Enter your credentials to continue to your workspace."
        }
      />

      {mustChangePassword ? (
        <div className="flex w-full flex-col space-y-5">
          <p className="text-sm text-zinc-500">
            Signing in as{" "}
            <span className="font-medium text-zinc-800">{changeEmail}</span>
          </p>
          <AuthField
            label="New password"
            htmlFor="change-password-input"
            error={changeErrors.newPassword}
          >
            <AuthPasswordInput
              id="change-password-input"
              value={changeNewPassword}
              onChange={(e) => setChangeNewPassword(e.target.value)}
              aria-invalid={!!changeErrors.newPassword}
            />
          </AuthField>
          <AuthField
            label="Confirm password"
            htmlFor="change-confirm-password-input"
            error={changeErrors.confirmPassword}
          >
            <AuthPasswordInput
              id="change-confirm-password-input"
              value={changeConfirmPassword}
              onChange={(e) => setChangeConfirmPassword(e.target.value)}
              aria-invalid={!!changeErrors.confirmPassword}
            />
          </AuthField>
          <button
            type="button"
            disabled={changePasswordMutation.isPending}
            onClick={onChangePasswordSubmit}
            className={AUTH_PRIMARY_BUTTON}
          >
            {changePasswordMutation.isPending
              ? "Setting password..."
              : "Set password and continue"}
          </button>
        </div>
      ) : !tFAEnabled ? (
        <>
          <button
            type="button"
            onClick={() => handleContinueWithGoogleClick()}
            disabled={googleMutation.isPending}
            className={AUTH_OUTLINE_BUTTON}
          >
            <FcGoogle className="h-4 w-4" />
            {googleMutation.isPending ? "Redirecting..." : "Continue with Google"}
          </button>
          <AuthDivider />
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
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <AuthField
                  label="Password"
                  htmlFor="password-input"
                  error={fieldState.invalid ? "Invalid password" : undefined}
                >
                  <AuthPasswordInput
                    {...field}
                    id="password-input"
                    aria-invalid={fieldState.invalid}
                  />
                </AuthField>
              )}
            />
            <div className="flex items-center justify-end">
              <Link
                href={CLIENT_AUTH_FORGOT_PASSWORD_PAGE}
                className="text-xs font-medium text-zinc-900 hover:underline transition"
              >
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={signInMutation.isPending}
              className={AUTH_PRIMARY_BUTTON}
            >
              {signInMutation.isPending ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </>
      ) : (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col space-y-5"
        >
          <p className="text-sm text-zinc-500">
            Enter the verification code we sent to{" "}
            <span className="font-medium text-zinc-800">{emailValue}</span>
          </p>
          <Controller
            control={form.control}
            name="code"
            render={({ field, fieldState }) => (
              <AuthField
                label="OTP code"
                htmlFor="code-input"
                error={
                  fieldState.invalid ? "Enter the code from your email" : undefined
                }
              >
                <OTP {...field} length={CODE_LENGTH} />
                <div className="flex h-6 items-center justify-end">
                  {resendIn <= 0 ? (
                    <button
                      type="button"
                      disabled={
                        !!resendIn || resendVerificationCodeMutation.isPending
                      }
                      onClick={() => {
                        if (resendIn <= 0) {
                          const body: ResendVerificationCodeSchema = {
                            email: emailValue,
                          };

                          resendVerificationCodeMutation.mutate({ body });
                        }
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-zinc-900 hover:underline transition disabled:opacity-50"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Resend
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-400">
                      Resend in {resendIn}s
                    </span>
                  )}
                </div>
              </AuthField>
            )}
          />
          <button
            type="submit"
            disabled={signInMutation.isPending}
            className={AUTH_PRIMARY_BUTTON}
          >
            {signInMutation.isPending ? "Verifying..." : "Continue"}
          </button>
        </form>
      )}
    </div>
  );
};

export default Client;
