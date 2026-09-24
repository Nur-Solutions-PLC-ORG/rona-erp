"use client";

import { cn } from "@/lib/utils";
import { HiOutlineXMark } from "react-icons/hi2";
import {
  Children,
  isValidElement,
  type ChangeEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { BTN_PRIMARY, BTN_SECONDARY, INPUT_CLASS, LABEL_CLASS } from "./ui";
import Dropdown from "@/components/custom/dropdown";

export function LabeledInput({
  label,
  id,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <input
        id={id}
        {...props}
        className={cn(INPUT_CLASS, error && "ring-2 ring-rose-500 border-rose-500")}
      />
      {error ? (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}

function nodeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement(node)) {
    return nodeText(
      (node as ReactElement<{ children?: ReactNode }>).props.children,
    );
  }
  return "";
}

export function LabeledSelect({
  label,
  id,
  error,
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const options = Children.toArray(children)
    .filter(isValidElement)
    .filter((child) => (child as ReactElement).type === "option")
    .map((child) => {
      const option = child as ReactElement<{
        value?: string | number | readonly string[];
        children?: ReactNode;
      }>;
      return {
        value: String(option.props.value ?? ""),
        label: nodeText(option.props.children),
      };
    });
  const emptyOption = options.find((option) => option.value === "");

  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <Dropdown
        id={id}
        value={String(props.value ?? "")}
        onChange={(value) =>
          props.onChange?.({
            target: { value },
          } as unknown as ChangeEvent<HTMLSelectElement>)
        }
        options={options}
        disabled={props.disabled}
        placeholder={emptyOption?.label ?? "Select…"}
        className={
          error
            ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
            : undefined
        }
      />
      {error ? (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}

export function LabeledTextarea({
  label,
  id,
  error,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        {...props}
        className={cn(
          INPUT_CLASS,
          "resize-none min-h-20",
          error && "ring-2 ring-rose-500 border-rose-500",
        )}
      />
      {error ? (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}

export function ModalWrapper({
  open,
  onClose,
  children,
  maxWidth = "max-w-lg",
  role = "dialog",
}: {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  maxWidth?: string;
  role?: HTMLAttributes<HTMLDivElement>["role"];
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-zinc-900/40"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && onClose) onClose();
        }}
      />
      <div
        role={role}
        aria-modal="true"
        className={cn(
          "drawer-slide-in fixed inset-y-0 right-0 z-10 flex w-full max-w-lg flex-col overflow-hidden bg-white shadow-xl",
          maxWidth,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  title,
  icon,
  onClose,
  className,
}: {
  title: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-b border-zinc-200 flex items-center justify-between shrink-0",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        {icon ? (
          <div className="w-7 h-7 flex items-center justify-center text-zinc-500 shrink-0">
            {icon}
          </div>
        ) : null}
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-700 rounded-md p-1 hover:bg-zinc-100 transition-colors"
          aria-label="Close"
        >
          <HiOutlineXMark className="w-5 h-5" />
        </button>
      ) : null}
    </div>
  );
}

export function ModalBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-6 py-5 overflow-y-auto flex-1 min-h-0 space-y-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ModalSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ModalFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex justify-end gap-3 shrink-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FormModal({
  open,
  onClose,
  title,
  icon,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}) {
  const action = findActionChild(children);
  return (
    <ModalWrapper open={open} onClose={onClose} maxWidth={maxWidth}>
      <ModalHeader title={title} icon={icon} onClose={onClose} />
      <ModalBody>{action.rest}</ModalBody>
      {action.node ? <ModalFooter>{action.node}</ModalFooter> : null}
    </ModalWrapper>
  );
}

function findActionChild(children: ReactNode): {
  node: ReactNode;
  rest: ReactNode;
} {
  const kids = Children.toArray(children);
  const index = kids.findIndex((child) => {
    if (!isValidElement(child)) return false;
    return child.type === ModalActions;
  });
  if (index === -1) return { node: null, rest: children };
  const node = kids[index];
  const rest = kids.filter((_, i) => i !== index);
  return { node, rest };
}

export function ModalActions({
  onCancel,
  onSubmit,
  submitLabel,
  isPending,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  isPending?: boolean;
}) {
  return (
    <>
      <button type="button" className={BTN_SECONDARY} onClick={onCancel}>
        Cancel
      </button>
      <button
        type="button"
        className={BTN_PRIMARY}
        onClick={onSubmit}
        disabled={isPending}
      >
        {isPending ? "Working..." : submitLabel}
      </button>
    </>
  );
}
