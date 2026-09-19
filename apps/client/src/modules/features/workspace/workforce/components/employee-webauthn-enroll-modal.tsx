"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HiOutlineFingerPrint } from "react-icons/hi2";
import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startRegistration,
  WebAuthnError,
} from "@simplewebauthn/browser";
import type { WebAuthnRegistrationVerifyInput } from "@rona/types/hr";
import { Card } from "@/modules/workspace/components/ui";
import { FormModal, ModalActions } from "@/modules/workspace/components/form";
import {
  ApiPostEmployeeWebAuthnRegisterOptions,
  ApiPostEmployeeWebAuthnRegisterVerify,
} from "../api";

interface EnrollableEmployee {
  id: string;
  fullName: string;
  eid: string;
}

function fingerprintError(error: unknown): string {
  if (error instanceof WebAuthnError) {
    if (error.name === "NotAllowedError" || error.name === "InvalidStateError") {
      return "Fingerprint not recognized, cancelled, or already enrolled on this device. Try again.";
    }
    if (error.name === "NotSupportedError" || error.name === "SecurityError") {
      return "Fingerprint enrollment is not supported on this device or website.";
    }
    return "Fingerprint enrollment failed. Please try again.";
  }
  return "Fingerprint enrollment failed. Please try again.";
}

// Enrolls the employee's fingerprint (WebAuthn platform credential) on the
// device running this browser. Run this ON the tablet the employee will use
// at the kiosk — credentials never transfer between devices.
export default function EmployeeWebAuthnEnrollModal({
  employee,
  onClose,
}: {
  employee: EnrollableEmployee;
  onClose: () => void;
}) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [platformReady, setPlatformReady] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const supportsWebAuthn = browserSupportsWebAuthn();
      if (!supportsWebAuthn) {
        if (!cancelled) {
          setSupported(false);
          setMessage(
            "This browser does not support fingerprint sign-in (WebAuthn).",
          );
        }
        return;
      }
      try {
        const platform = await platformAuthenticatorIsAvailable();
        if (!cancelled) {
          setSupported(true);
          setPlatformReady(platform);
          if (!platform) {
            setMessage(
              "This device has no fingerprint sensor or none is set up. Add a fingerprint in the device settings first.",
            );
          }
        }
      } catch {
        if (!cancelled) {
          setSupported(true);
          setPlatformReady(false);
        }
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const enroll = async () => {
    if (enrolling) return;
    setEnrolling(true);
    setMessage("");
    try {
      const optionsResponse = await ApiPostEmployeeWebAuthnRegisterOptions({
        slugReplacement: { id: employee.id },
      });
      if (!optionsResponse.success || !optionsResponse.data) {
        setMessage(optionsResponse.message ?? "Could not start enrollment.");
        return;
      }
      const credential = await startRegistration({
        optionsJSON: optionsResponse.data.options,
      });
      const verifyResponse = await ApiPostEmployeeWebAuthnRegisterVerify({
        slugReplacement: { id: employee.id },
        body: {
          challenge: optionsResponse.data.challengeId,
          // Serialized to JSON on the wire; the server re-validates the shape.
          response: credential as unknown as WebAuthnRegistrationVerifyInput["response"],
        },
      });
      if (!verifyResponse.success || !verifyResponse.data) {
        setMessage(verifyResponse.message ?? "Enrollment could not be saved.");
        return;
      }
      setDone(true);
      toast.success(`${employee.fullName} can now sign in with this fingerprint.`);
      onClose();
    } catch (error) {
      setMessage(fingerprintError(error));
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <FormModal
      open
      onClose={onClose}
      title="Enroll fingerprint"
      icon={<HiOutlineFingerPrint className="h-4 w-4" />}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <Card className="flex items-center gap-3 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
            <HiOutlineFingerPrint className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate">
              {employee.fullName}
            </p>
            <p className="text-xs text-zinc-500 font-mono">EID {employee.eid}</p>
          </div>
        </Card>

        <p className="text-xs leading-relaxed text-zinc-600">
          Do this on the tablet the employee will use at the kiosk. The
          fingerprint itself never leaves the device — Rona stores only a
          cryptographic key, and the device verifies the fingerprint locally at
          punch time.
        </p>

        {message ? (
          <p
            role="status"
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700"
          >
            {message}
          </p>
        ) : null}

        {supported === true && platformReady && !done ? (
          <ModalActions
            onCancel={onClose}
            onSubmit={() => void enroll()}
            submitLabel="Scan fingerprint"
            isPending={enrolling}
          />
        ) : (
          <ModalActions onCancel={onClose} onSubmit={onClose} submitLabel="Close" />
        )}
      </div>
    </FormModal>
  );
}
