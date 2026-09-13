"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { TryCatchNullWrap } from "@/api";
import { useCurrentOrganization, usePermissions } from "@/modules/workspace/hooks";
import { useSession } from "@/modules/auth/hooks";
import { useCreateMutation } from "@/hooks/utils";
import {
  ApiAiChat,
  ApiAiHealth,
  ApiAiReportExport,
  ApiAiReportStatus,
  ApiAiSummary,
} from "./api";
import type {
  AiChatResult,
  AiMetricGroup,
  AiReportRequest,
  AiReportResult,
} from "@rona/types/ai";

export const useAiSummary = () => {
  const query = useQuery({
    queryKey: ["ai-summary"],
    queryFn: TryCatchNullWrap(ApiAiSummary),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    summary: query.data?.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

export const useAiHealth = () => {
  const query = useQuery({
    queryKey: ["ai-health"],
    queryFn: TryCatchNullWrap(ApiAiHealth),
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });

  return {
    health: query.data?.data ?? null,
  };
};

export const useAiReportExport = () => {
  return useCreateMutation<AiReportResult, AiReportRequest>(
    (input) => ApiAiReportExport({ body: input }),
    (data) => toast.success(data.message),
    (error) => toast.error(error.message),
  );
};

export function useAiReportStatus(
  reportId: string | null,
  isSettled: boolean,
) {
  const query = useQuery({
    queryKey: ["ai-report-status", reportId],
    queryFn: TryCatchNullWrap(() =>
      ApiAiReportStatus({ slugReplacement: { reportId: reportId ?? "" } }),
    ),
    enabled: reportId !== null && !isSettled,
    refetchInterval: 2000,
  });

  const result: AiReportResult | null = query.data?.data ?? null;

  return {
    report: result,
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  question?: string;
  result?: AiChatResult;
  error?: string;
  animated: boolean;
}

let messageSeq = 0;
const nextId = () => `msg-${Date.now()}-${++messageSeq}`;

export type AiLanguage = "en" | "am" | "om";

const CHAT_STORAGE_PREFIX = "rona-ai-chat";
const CHAT_STORAGE_VERSION = "v1";

function chatStorageKey(userId: string, organizationId: string | null) {
  return `${CHAT_STORAGE_PREFIX}:${CHAT_STORAGE_VERSION}:${userId}:${organizationId ?? "none"}`;
}

function loadChatTranscriptFromKey(
  key: string,
): { messages: ChatMessage[]; language: AiLanguage } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      messages?: ChatMessage[];
      language?: AiLanguage;
    };
    if (!Array.isArray(parsed.messages)) return null;
    return {
      messages: parsed.messages.map((message) => ({ ...message, animated: false })),
      language: parsed.language === "am" || parsed.language === "om" ? parsed.language : "en",
    };
  } catch {
    return null;
  }
}

function saveChatTranscriptByKey(
  key: string,
  messages: ChatMessage[],
  language: AiLanguage,
) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ messages, language }));
  } catch {
  }
}

function removeChatTranscript(userId: string, organizationId: string | null) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(chatStorageKey(userId, organizationId));
  } catch {
  }
}

export function useAiChat() {
  const { user } = useSession();
  const { organizationId } = useCurrentOrganization();
  const userId = user?.id ?? "";
  const storageKey = userId ? chatStorageKey(userId, organizationId) : null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [language, setLanguage] = useState<AiLanguage>("en");
  const skipPersistRef = useRef(false);

  useEffect(() => {
    if (!storageKey) return;
    const stored = loadChatTranscriptFromKey(storageKey);
    skipPersistRef.current = true;
    queueMicrotask(() => {
      setMessages(stored?.messages ?? []);
      setLanguage(stored?.language ?? "en");
    });
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    saveChatTranscriptByKey(storageKey, messages, language);
  }, [storageKey, messages, language]);

  const mutation = useMutation({
    mutationFn: ApiAiChat,
  });

  const send = async (question: string) => {
    const userMessage: ChatMessage = {
      id: nextId(),
      role: "user",
      question,
      animated: false,
    };
    const pendingId = nextId();
    const pendingMessage: ChatMessage = {
      id: pendingId,
      role: "assistant",
      animated: false,
    };

    setMessages((prev) => [...prev, userMessage, pendingMessage]);

    try {
      const response = await mutation.mutateAsync({
        body: language === "en" ? { question } : { question, language },
      });
      const result = response.data;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === pendingId
            ? { ...message, result, animated: true }
            : message,
        ),
      );
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Rona AI is unavailable right now. Try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId ? { ...m, error: message, animated: false } : m,
        ),
      );
    }
  };

  const markAnimated = (id: string) =>
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, animated: false } : message,
      ),
    );

  const clear = () => {
    setMessages([]);
    if (userId) removeChatTranscript(userId, organizationId);
  };

  return {
    messages,
    send,
    markAnimated,
    clear,
    language,
    setLanguage,
    isSending: mutation.isPending,
  };
}

export function useTypewriter(text: string, charsPerTick = 3) {
  const [state, setState] = useState({ forText: "", visible: "" });

  useEffect(() => {
    if (!text) return;

    let index = 0;
    const timer = setInterval(() => {
      index = Math.min(text.length, index + charsPerTick);
      setState({ forText: text, visible: text.slice(0, index) });
      if (index >= text.length) clearInterval(timer);
    }, 12);

    return () => clearInterval(timer);
  }, [text, charsPerTick]);

  const shown = state.forText === text ? state.visible : "";

  return {
    text: shown,
    done: text.length > 0 && shown.length >= text.length,
  };
}

const AI_DOMAIN_PERMISSIONS = [
  "hr.employee.read",
  "hr.attendance.read",
  "manufacturing.production.read",
  "inventory.stock.read",
  "quality.inspection.read",
  "finance.invoice.read",
  "sales.order.read",
  "membership.read",
  "manufacturing.bom.read",
] as const;

export function useHasAnyAiDomain() {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission([...AI_DOMAIN_PERMISSIONS]);
}

export function useAiDomainsAvailable() {
  const { hasPermission } = usePermissions();
  return useMemo(
    () => ({
      hr: hasPermission("hr.employee.read"),
      attendance: hasPermission("hr.attendance.read"),
      production: hasPermission("manufacturing.production.read"),
      inventory: hasPermission("inventory.stock.read"),
      quality: hasPermission("quality.inspection.read"),
      finance: hasPermission("finance.invoice.read"),
      sales: hasPermission("sales.order.read"),
      organization: hasPermission("membership.read"),
      bom: hasPermission("manufacturing.bom.read"),
    }),
    [hasPermission],
  );
}

export function summaryMetricPoints(groups: AiMetricGroup[]) {
  return groups
    .flatMap((group) =>
      group.metrics
        .filter((metric) => metric.numericValue != null)
        .map((metric) => ({
          group: group.label,
          label: metric.label,
          value: metric.numericValue as number,
        })),
    )
    .filter((point) => Number.isFinite(point.value));
}
