"use client";

import { Check, ChevronDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Option = {
  label: string;
  value: string;
  color?: string;
  id?: string;
  icon?: React.ComponentType<{ className?: string }>;
  desc?: string;
};

type DropdownProps = {
  options: Option[];
  value?: string;
  label?: string;
  desc?: string;
  name?: string;
  id?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ghost?: boolean;
  translucent?: boolean;
  className?: string;
  search?: boolean;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
};

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  label,
  desc,
  name,
  id,
  onChange,
  placeholder = "Select an option",
  ghost,
  className,
  icon: Icon,
  search,
  disabled,
  translucent,
}) => {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((o) => o.value === value);

  const dropdownElement = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal min-w-24 border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:text-slate-700 aria-expanded:bg-white aria-expanded:text-slate-700 focus-visible:ring-purple-500/30 focus-visible:border-purple-500",
            ghost &&
              "bg-transparent shadow-none border-none rounded-none hover:bg-transparent",
            translucent && "bg-white/75 shadow-none border-none",
            className,
          )}
        >
          <div className="flex items-center overflow-hidden gap-2">
            {Icon && <Icon className="mr-1 h-4 w-4 shrink-0 text-slate-400" />}
            {selectedOption?.icon && (
              <selectedOption.icon className="h-4 w-4 shrink-0 text-slate-500" />
            )}
            {selectedOption?.color && (
              <span
                style={{ backgroundColor: selectedOption.color }}
                className="size-3 rounded-full"
              />
            )}

            {selectedOption?.id && (
              <span className="font-mono bg-secondary rounded-sm px-0.5 text-[10px] ">
                {selectedOption.id}
              </span>
            )}

            <span
              className={cn(
                "truncate",
                !selectedOption?.label && "text-muted-foreground",
              )}
            >
              {selectedOption?.label ?? placeholder}
            </span>
          </div>

          <ChevronDown
            className={cn(
              "ml-2 h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-max min-w-(--radix-popover-trigger-width) gap-0 max-h-72 overflow-y-auto rounded-lg border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/5 ring-0"
        align="start"
      >
        <Command className="p-0">
          {search && (
            <>
              <CommandInput placeholder="Search..." />
              <span className="border-b -mx-2" />
            </>
          )}

          <CommandList className="overflow-y-auto">
            <CommandEmpty className="text-sm! opacity-50!">
              No options found.
            </CommandEmpty>

            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label + option.value}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 data-selected:bg-slate-100 data-selected:text-slate-900",
                    value === option.value &&
                      "bg-purple-50 text-purple-700 hover:bg-purple-50",
                  )}
                >
                  {option.icon && (
                    <option.icon
                      className={cn(
                        "h-4 w-4 shrink-0 text-slate-400",
                        value === option.value && "text-purple-600",
                      )}
                    />
                  )}
                  {option.color && (
                    <span
                      style={{ backgroundColor: option.color }}
                      className="size-3 rounded-full"
                    />
                  )}
                  {option.id && (
                    <span className="font-mono bg-secondary rounded-sm px-0.5 text-[10px] ">
                      {option.id}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.desc ? (
                      <span className="block truncate text-[11px] font-normal text-slate-400">
                        {option.desc}
                      </span>
                    ) : null}
                  </span>
                  <Check
                    className={cn(
                      "h-4 w-4 absolute top-1/2 -translate-y-1/2 right-2 text-purple-600",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  if (!label) return dropdownElement;

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>

      {dropdownElement}

      {desc && <span className="text-sm text-muted-foreground">{desc}</span>}
    </div>
  );
};

export default Dropdown;
