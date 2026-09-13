"use client";

import { HiOutlineChevronDown } from "react-icons/hi2";

const faqs = [
  {
    question: "How does multi-tenant security work?",
    answer:
      "Data is isolated at the database level with row-level security — each organization can only ever see its own records.",
  },
  {
    question: "What modules are included?",
    answer:
      "Inventory control, manufacturing, traceability, and workforce management are all included out of the box.",
  },
  {
    question: "Can I change my plan later?",
    answer:
      "Yes, upgrade or switch plans anytime from your workspace settings.",
  },
  {
    question: "How do I get started?",
    answer:
      "Sign up, launch your workspace, and start setting up your inventory immediately.",
  },
];

export function FaqAccordion() {
  return (
    <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
      {faqs.map((item) => (
        <FaqItem key={item.question} question={item.question} answer={item.answer} />
      ))}
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group open:bg-zinc-50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-semibold text-zinc-900">{question}</span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-all duration-200 group-open:rotate-180 group-open:border-zinc-300 group-open:bg-zinc-100 group-open:text-zinc-700">
          <HiOutlineChevronDown className="h-3.5 w-3.5" />
        </span>
      </summary>
      <div className="px-5 pb-4">
        <p className="text-sm leading-relaxed text-zinc-600">{answer}</p>
      </div>
    </details>
  );
}
