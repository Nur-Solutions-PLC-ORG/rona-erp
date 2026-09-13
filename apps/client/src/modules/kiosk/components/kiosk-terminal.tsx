"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AttendanceEventType } from "@rona/types/hr";
import {
  HiOutlineArrowLeftOnRectangle,
  HiOutlineArrowRightOnRectangle,
  HiOutlineCheckCircle,
  HiOutlineDevicePhoneMobile,
  HiOutlinePause,
  HiOutlinePlay,
} from "react-icons/hi2";
import Spinner from "@/components/custom/spinner";
import {
  postKioskAttendance,
  postKioskAuthenticate,
  postKioskSignOut,
} from "../api";

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

export default function KioskTerminal() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [organizationName, setOrganizationName] = useState("");
  const [kioskName, setKioskName] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [eid, setEid] = useState("");
  const [passcode, setPasscode] = useState("");
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

  const clearResetTimer = useCallback(() => {
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }
    setResetIn(null);
  }, []);

  const scheduleIdleReset = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setResetIn(IDLE_RESET_SECONDS);
    resetTimer.current = setTimeout(() => {
      resetTimer.current = null;
      setResetIn(null);
      setEid("");
      setPasscode("");
      setScreen("idle");
    }, 1000 * IDLE_RESET_SECONDS);
  }, []);

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
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await postKioskAttendance({
        eid: eid.trim(),
        passcode: passcode.trim(),
        eventType,
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
        setPasscode("");
      }
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 401) {
        clearResetTimer();
        setScreen("setup");
        setDeviceToken("");
        setMessage("Kiosk session ended. Please re-enter the device credential.");
      } else if (status === 429) {
        setMessage("Too many attempts. Please try again in a few minutes.");
      } else {
        const apiMessage = (
          error as { response?: { data?: { message?: string } } }
        ).response?.data?.message;
        setMessage(apiMessage ?? "Something went wrong. Please try again.");
        setPasscode("");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await postKioskSignOut();
    } catch {
    }
    clearResetTimer();
    setOrganizationName("");
    setKioskName("");
    setDeviceToken("");
    setEid("");
    setPasscode("");
    setSuccess(null);
    setMessage("");
    setScreen("setup");
  };

  const canPunch = eid.trim().length > 0 && passcode.trim().length > 0 && !busy;

  return (
    <div className="min-h-screen flex flex-col select-none bg-slate-100 text-slate-900">
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
                    onChange={(event) => setEid(event.target.value)}
                    placeholder="00000"
                    autoComplete="off"
                    className={KIOSK_INPUT_CLASS}
                  />
                </div>
                <div>
                  <label
                    htmlFor="kiosk-passcode"
                    className="mb-2 block text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Passcode
                  </label>
                  <input
                    id="kiosk-passcode"
                    type="password"
                    inputMode="numeric"
                    value={passcode}
                    onChange={(event) => setPasscode(event.target.value)}
                    placeholder="•••••"
                    autoComplete="off"
                    className={KIOSK_INPUT_CLASS}
                  />
                </div>
              </div>

              {message ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-center text-base font-medium text-rose-600">
                  {message}
                </p>
              ) : (
                <p className="text-center text-sm text-slate-400">
                  Enter your employee ID and passcode, then choose an action.
                </p>
              )}

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
            </div>
            <p className="text-center text-xs text-slate-400">
              Rona Workforce — secure attendance terminal
            </p>
          </div>
        ) : null}

        {screen === "success" && success ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
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
