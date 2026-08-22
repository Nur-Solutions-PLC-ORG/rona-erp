"use client";

import { Calendar } from "@/components/ui/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

type DatePickerInputProps = {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  name?: string;
  className?: string;
};

export function DatePickerInput({
  value,
  onChange,
  disabled = false,
  name,
  className,
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>(value);
  const [inputValue, setInputValue] = React.useState(formatDate(value));

  const [prevValue, setPrevValue] = React.useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setMonth(value);
    setInputValue(formatDate(value));
  }

  return (
    <InputGroup className={className}>
      <InputGroupInput
        id={name || "date-required"}
        name={name}
        value={inputValue}
        placeholder="eg. June 01, 2025"
        disabled={disabled}
        onChange={(e) => {
          setInputValue(e.target.value);
          const date = new Date(e.target.value);
          if (isValidDate(date)) {
            onChange(date);
            setMonth(date);
          } else {
            onChange(undefined);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !disabled) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      />
      <InputGroupAddon align="inline-end">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <InputGroupButton
              id="date-picker"
              variant="ghost"
              size="icon-xs"
              aria-label="Select date"
              disabled={disabled}
            >
              <CalendarIcon />
              <span className="sr-only">Select date</span>
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={value}
              month={month}
              onMonthChange={setMonth}
              onSelect={(date) => {
                onChange(date);
                setInputValue(formatDate(date));
                setOpen(false);
              }}
              disabled={disabled}
            />
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  );
}
