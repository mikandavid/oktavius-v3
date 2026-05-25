import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as React from 'react';

import { Label } from './label';
import { pressableMicroClasses } from '../lib/microInteractions';
import { cn } from '../lib/utils';

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn('grid gap-2', className)} {...props} />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

export interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
> {
  ref?: React.Ref<React.ElementRef<typeof RadioGroupPrimitive.Item>>;
}

export function RadioGroupItem({ className, ref, ...props }: RadioGroupItemProps) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square h-4 w-4 shrink-0 cursor-pointer rounded-full border border-border bg-muted/60',
        pressableMicroClasses,
        'hover:bg-muted/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:border-cta data-[state=checked]:hover:border-cta/90',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="h-2 w-2 rounded-full bg-cta" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupFieldProps {
  id?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Labeled radio options — use inside FormField for mutually exclusive visible choices.
 */
export function RadioGroupField({
  id,
  options,
  value,
  onChange,
  disabled = false,
  className,
  orientation = 'vertical',
}: RadioGroupFieldProps) {
  return (
    <RadioGroup
      id={id}
      value={value}
      disabled={disabled}
      className={cn(
        orientation === 'horizontal' ? 'flex flex-wrap gap-x-4 gap-y-2' : 'gap-2',
        className,
      )}
      onValueChange={onChange}
    >
      {options.map((option) => {
        const itemId = `${id ?? 'radio'}-${option.value}`;
        return (
          <div key={option.value} className="flex items-start gap-2">
            <RadioGroupItem
              id={itemId}
              value={option.value}
              disabled={option.disabled}
              className="mt-0.5"
            />
            <div className="grid gap-0.5 leading-none">
              <Label htmlFor={itemId} className="text-sm font-medium text-foreground">
                {option.label}
              </Label>
              {option.description ? (
                <p className="text-xs text-muted-foreground">{option.description}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </RadioGroup>
  );
}
