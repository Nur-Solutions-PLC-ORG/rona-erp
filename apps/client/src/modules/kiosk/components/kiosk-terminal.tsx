"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AttendanceEventType } from "@rona/types/hr";
import {
  HiOutlineArrowLeftOnRectangle,
  HiOutlineArrowRightOnRectangle,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineDevicePhoneMobile,
  HiOutlineFaceSmile,
  HiOutlinePause,
  HiOutlinePlay,
} from "react-icons/hi2";
import Spinner from "@/components/custom/spinner";
import { cn } from "@/lib/utils";
import {
  postKioskAuthenticate,
  postKioskFaceAttendance,
  postKioskSignOut,
} from "../api";
import { captureFace, friendlyFaceError, preloadFaceModels } from "../face-api";

type Screen = "setup" | "idle" | "success";

const IDLE_RESET_SECONDS = 10;

const EVENT_META: Record<
  AttendanceEventType,
  {
    label: string;
    heading: string;
    button: string;
    headingText: string;
    Icon: typeof HiOutlinePlay;
  }
> = {
  CLOCK_IN: {
    label: "Clock In",
    heading: "Clocked In",
    button:
      "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-xl shadow-emerald-600/20",
    headingText: "text-emerald-600",
    Icon: HiOutlineArrowRightOnRectangle,
  },
  CLOCK_OUT: {
    label: "Clock Out",
    heading: "Clocked Out",
    button:
      "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-xl shadow-rose-600/20",
    headingText: "text-rose-600",
    Icon: HiOutlineArrowLeftOnRectangle,
  },
  BREAK_START: {
    label: "Start Break",
    heading: "Break Started",
    button:
      "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 shadow-xl shadow-amber-500/20",
    headingText: "text-amber-600",
    Icon: HiOutlinePause,
  },
  BREAK_END: {
    label: "End Break",
    heading: "Break Ended",
    button:
      "bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-xl shadow-sky-600/20",
    headingText: "text-sky-600",
    Icon: HiOutlinePlay,
  },
};

const EVENT_ORDER: AttendanceEventType[] = [
  "CLOCK_IN",
  "CLOCK_OUT",
  "BREAK_START",
  "BREAK_END",
];

const KIOSK_INPUT_CLASS =
  "w-full rounded-xl bg-white border border-slate-300 px-6 py-5 text-2xl text-center font-mono tracking-widest text-slate-900 placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-colors";

function scanExpired(expiresAt: number): boolean {
  return expiresAt <= Date.now();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function StepPill({
  step,
  label,
  done,
  active,
}: {
  step: number;
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors sm:text-sm",
        done
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : active
            ? "border-purple-200 bg-purple-50 text-purple-700"
            : "border-slate-200 bg-white text-slate-400",
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold",
          done
            ? "border-emerald-500 bg-emerald-500 text-white"
            : active
              ? "border-purple-400 text-purple-600"
              : "border-slate-300 text-slate-400",
        )}
      >
        {done ? <HiOutlineCheck className="h-3 w-3" /> : step}
      </span>
      {label}
    </span>
  );
}

export default function KioskTerminal() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [organizationName, setOrganizationName] = useState("");
  const [kioskName, setKioskName] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [eid, setEid] = useState("");
  const [faceScan, setFaceScan] = useState<{
    eid: string;
    descriptor: number[];
    expiresAt: number;
  } | null>(null);
  const scanRef = useRef<typeof faceScan>(null);
  const captureController = useRef<AbortController | null>(null);
  const punchPending = useRef(false);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [faceScanning, setFaceScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState<{
    employeeName: string;
    eventLabel: string;
    eventTime: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const [resetIn, setResetIn] = useState<number | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    preloadFaceModels();
  }, []);

  const clearResetTimer = useCallback(() => {
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }
    setResetIn(null);
  }, []);

  const clearFaceScan = useCallback(() => {
    captureController.current?.abort();
    captureController.current = null;
    if (scanTimer.current) clearTimeout(scanTimer.current);
    scanTimer.current = null;
    scanRef.current = null;
    setFaceScan(null);
    setFaceScanning(false);
  }, []);

  useEffect(() => () => {
    captureController.current?.abort();
    if (scanTimer.current) clearTimeout(scanTimer.current);
    scanRef.current = null;
  }, []);

  const scheduleIdleReset = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setResetIn(IDLE_RESET_SECONDS);
    resetTimer.current = setTimeout(() => {
      resetTimer.current = null;
      setResetIn(null);
      setEid("");
      clearFaceScan();
      setScreen("idle");
    }, 1000 * IDLE_RESET_SECONDS);
  }, [clearFaceScan]);

  useEffect(() => {
    if (resetIn === null || resetIn <= 0) return;
    const tick = setTimeout(
      () => setResetIn((value) => (value === null ? null : value - 1)),
      1000,
    );
    return () => clearTimeout(tick);
  }, [resetIn]);

  useEffect(() => () => clearResetTimer(), [clearResetTimer]);

  const handleSetup = async () => {
    if (!deviceToken.trim() || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await postKioskAuthenticate(deviceToken.trim());
      if (response.success && response.data) {
        setOrganizationName(response.data.organizationName);
        setKioskName(response.data.name);
        setScreen("idle");
      } else {
        setMessage(response.message);
      }
    } catch {
      setMessage(
        "This device is not registered or is not allowed to use kiosk terminals.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handlePunch = async (eventType: AttendanceEventType) => {
    if (busy || screen !== "idle" || faceScanning || captureController.current || punchPending.current || !eid.trim()) return;
    const scan = scanRef.current;
    if (scan && (scan.eid !== eid.trim() || scanExpired(scan.expiresAt))) {
      clearFaceScan();
      setMessage("Face scan expired or employee ID changed. Capture a new scan.");
      return;
    }
    if (!scan) return;
    punchPending.current = true;
    clearFaceScan();
    setBusy(true);
    setMessage("");
    try {
      const response = await postKioskFaceAttendance({
        eventType,
        eid: scan.eid,
        descriptor: scan.descriptor,
      });
      if (response.success && response.data) {
        setSuccess({
          employeeName: response.data.employeeName,
          eventLabel: EVENT_META[response.data.eventType].heading,
          eventTime: formatTime(response.data.eventAt),
        });
        setScreen("success");
        scheduleIdleReset();
      } else {
        setMessage(response.message);

      }
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      const apiMessage = (
        error as { response?: { data?: { message?: string } } }
      ).response?.data?.message;
      const faceMismatch = Boolean(scan && typeof apiMessage === "string" && /face|match|recogniz/i.test(apiMessage));
      if (status === 401 && !faceMismatch) {
        clearResetTimer();
        setScreen("setup");
        setDeviceToken("");
        setEid("");
        setMessage("Kiosk session ended. Please re-enter the device credential.");
      } else if (status === 429) {
        setMessage("Too many attempts. Please try again in a few minutes.");
      } else {
        setMessage(apiMessage ?? "Something went wrong. Please try again.");
      }
    } finally {

      punchPending.current = false;
      setBusy(false);
    }
  };

  const handleFaceCapture = async () => {
    if (busy || captureController.current || punchPending.current || !eid.trim()) return;
    clearFaceScan();
    const controller = new AbortController();
    const capturedEid = eid.trim();
    captureController.current = controller;
    setFaceScanning(true);
    setMessage("");
    try {
      const descriptor = await captureFace(controller.signal);
      if (controller.signal.aborted || captureController.current !== controller) return;
      const scan = { eid: capturedEid, descriptor, expiresAt: Date.now() + 30000 };
      scanRef.current = scan;
      setFaceScan(scan);
      setMessage("Face captured. Verification happens when you press an action button below — choose one within 30 seconds.");
      scanTimer.current = setTimeout(() => {
        clearFaceScan();
        setMessage("Face scan expired. Capture a new face scan and try again.");
      }, 30000);
    } catch (error) {
      if (!controller.signal.aborted) {
        clearFaceScan();
        setMessage(friendlyFaceError(error));
      }
    } finally {
      if (captureController.current === controller) {
        captureController.current = null;
        setFaceScanning(false);
      }
    }
  };

  const handleSignOut = async () => {
    if (busy || punchPending.current) return;
    setBusy(true);
    clearFaceScan();
    clearResetTimer();
    try {
      await postKioskSignOut();
    } catch {
    }
    setOrganizationName("");
    setKioskName("");
    setDeviceToken("");
    setEid("");
    setSuccess(null);
    setMessage("");
    setScreen("setup");
    setBusy(false);
  };

  const canPunch =
    eid.trim().length > 0 && faceScan !== null && !busy && !faceScanning;

  return (
    <div className="min-h-screen flex flex-col select-none bg-slate-100 text-slate-900">
      <style>{`
        @keyframes rona-pop { 0% { transform: scale(0.4); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
        @keyframes rona-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
        @keyframes rona-ring { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,.5); } 100% { box-shadow: 0 0 0 14px rgba(16,185,129,0); } }
        .rona-pop { animation: rona-pop .5s cubic-bezier(.16,1,.3,1) both; }
        .rona-shake { animation: rona-shake .5s ease-in-out; }
        .rona-ring { animation: rona-ring 1.1s ease-out 2; }
      `}</style>
      <div className="h-1 shrink-0 bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-600" />

      <header className="flex items-center justify-between gap-4 bg-white border-b border-slate-200 px-6 sm:px-10 py-4 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Image
            src="/rona-logo.png"
            alt="Rona ERP"
            width={120}
            height={40}
            className="h-7 w-auto shrink-0"
            priority
          />
          {screen !== "setup" && organizationName ? (
            <div className="hidden md:flex items-center gap-2.5 pl-5 border-l border-slate-200 min-w-0">
              <span className="text-sm font-medium text-slate-700 truncate">
                {organizationName}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 shrink-0">
                <HiOutlineDevicePhoneMobile className="h-3.5 w-3.5" />
                {kioskName}
              </span>
            </div>
          ) : null}
        </div>
        {screen !== "setup" ? (
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <p className="font-mono tabular-nums text-2xl leading-none text-slate-900">
                {clock.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </p>
              <p className="mt-1.5 text-xs font-medium text-slate-400">
                {formatDate(clock)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={busy}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              End session
            </button>
          </div>
        ) : null}
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        {screen === "setup" ? (
          <div className="w-full max-w-md">
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-lg shadow-slate-900/5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <HiOutlineDevicePhoneMobile className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                  Kiosk setup
                </h2>
                <p className="text-sm leading-relaxed text-slate-500">
                  Enter the device credential issued by your administrator to
                  activate this terminal.
                </p>
              </div>
              <input
                type="password"
                value={deviceToken}
                onChange={(event) => setDeviceToken(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSetup();
                }}
                placeholder="Device credential"
                autoComplete="off"
                aria-label="Device credential"
                className={KIOSK_INPUT_CLASS}
              />
              <button
                type="button"
                onClick={handleSetup}
                disabled={busy || !deviceToken.trim()}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-purple-600 px-6 py-5 text-xl font-semibold text-white transition-colors hover:bg-purple-700 active:bg-purple-800 disabled:pointer-events-none disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Spinner className="h-5 w-5" />
                    Registering device…
                  </>
                ) : (
                  "Register this device"
                )}
              </button>
              {message ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {message}
                </p>
              ) : null}
            </div>
            <p className="mt-6 text-center text-xs text-slate-400">
              Rona Workforce — secure attendance terminal
            </p>
          </div>
        ) : null}

        {screen === "idle" ? (
          <div className="w-full max-w-3xl space-y-6">
            <div className="space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <StepPill
                  step={1}
                  label="Enter ID"
                  done={eid.trim().length > 0}
                  active={eid.trim().length === 0}
                />
                <span className="h-px w-5 bg-slate-200" />
                <StepPill
                  step={2}
                  label="Capture face"
                  done={faceScan !== null}
                  active={eid.trim().length > 0 && faceScan === null}
                />
                <span className="h-px w-5 bg-slate-200" />
                <StepPill
                  step={3}
                  label="Choose action"
                  done={false}
                  active={faceScan !== null}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="kiosk-eid"
                    className="mb-2 block text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Employee ID
                  </label>
                  <input
                    id="kiosk-eid"
                    type="text"
                    inputMode="numeric"
                    value={eid}
                    disabled={busy}
                    maxLength={50}
                    onChange={(event) => {
                      clearFaceScan();
                      setEid(event.target.value);

                      setMessage("");
                    }}
                    placeholder="00000"
                    autoComplete="off"
                    className={KIOSK_INPUT_CLASS}
                  />
                </div>
              </div>

              {message ? (
                <p className="rona-shake rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-center text-base font-medium text-rose-600">
                  {message}
                </p>
              ) : (
                <p className="text-center text-sm text-slate-400">
                  {faceScan
                    ? "Face captured — not verified yet. Press an action button below to verify and record attendance."
                    : "Enter your employee ID, capture your face, and press an action button."}
                </p>
              )}

              <div>
                <div className="relative flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Or
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleFaceCapture}
                    disabled={busy || faceScanning || faceScan !== null || !eid.trim()}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-6 py-4 text-lg font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {faceScanning ? (
                      <>
                        <Spinner className="h-5 w-5" />
                        Scanning…
                      </>
                    ) : faceScan ? (
                      <>
                        <HiOutlineFaceSmile className="h-6 w-6 text-emerald-600" />
                        Face ready — press an action below
                      </>
                    ) : (
                      <>
                        <HiOutlineFaceSmile className="h-6 w-6" />
                         Capture face
                      </>
                    )}
                  </button>
                  {faceScan ? (
                    <button
                      type="button"
                      onClick={() => {
                        clearFaceScan();
                        setMessage("");
                      }}
                      className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
                    >
                      Clear face
                    </button>
                  ) : null}
                </div>
              </div>

              {faceScan ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {EVENT_ORDER.map((eventType) => {
                    const { label, button, Icon } = EVENT_META[eventType];
                    return (
                      <button
                        key={eventType}
                        type="button"
                        disabled={!canPunch}
                        onClick={() => handlePunch(eventType)}
                        className={`flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-10 text-2xl font-bold tracking-wide text-white transition-colors disabled:pointer-events-none disabled:opacity-40 sm:py-12 ${button}`}
                      >
                        <Icon className="h-9 w-9" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-slate-400">
                  Capture your face to see attendance actions.
                </p>
              )}
            </div>
            <p className="text-center text-xs text-slate-400">
              Rona Workforce — secure attendance terminal
            </p>
          </div>
        ) : null}

        {screen === "success" && success ? (
          <div className="space-y-5 text-center">
            <div className="rona-pop rona-ring mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <HiOutlineCheckCircle className="h-11 w-11" />
            </div>
            <p className="font-heading text-5xl font-bold tracking-tight text-slate-900">
              {success.employeeName}
            </p>
            <p className="text-3xl font-semibold text-emerald-600">
              {success.eventLabel}
            </p>
            <p className="font-mono tabular-nums text-3xl text-slate-500">
              {success.eventTime}
            </p>
            {resetIn !== null ? (
              <p className="text-xs font-medium text-slate-400">
                Returning to home in {Math.max(resetIn, 1)}s…
              </p>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
