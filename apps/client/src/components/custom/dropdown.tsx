"use client";

import { Check, ChevronsUpDown } from "lucide-react";
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
};

type DropdownProps = {
  options: Option[];
  value?: string;
  label?: string;
  desc?: string;
  name?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ghost?: boolean;
  translucent?: boolean;
  className?: string;
  search?: boolean;
  disabled?: boolean;
  icon?: React.ForwardRefExoticComponent<
    React.RefAttributes<SVGSVGElement> & React.ComponentProps<"svg">
  >;
};

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  label,
  desc,
  name,
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
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-8 w-full justify-between font-normal min-w-24",
            ghost &&
              "bg-transparent shadow-none border-none rounded-none hover:bg-transparent",
            translucent && "bg-white/75 shadow-none border-none",
            className,
          )}
        >
          <div className="flex items-center overflow-hidden gap-2">
            {Icon && <Icon className="mr-2 h-5 w-5 shrink-0 text-black/50" />}
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

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
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
                >
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
                  {option.label}
                  <Check
                    className={cn(
                      "h-4 w-4 absolute top-1/2 -translate-y-1/2 right-2",
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
      <label htmlFor={name} className="text-sm text-gray-700">
        {label}
      </label>

      {dropdownElement}

      {desc && <span className="text-sm text-muted-foreground">{desc}</span>}
    </div>
  );
};

export default Dropdown;
