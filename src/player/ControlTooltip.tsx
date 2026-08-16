import type { ReactNode } from "react";

type ControlTooltipProps = {
  label: string;
  children: ReactNode;
};

export function ControlTooltip({ label, children }: ControlTooltipProps) {
  return (
    <span className="control-tooltip">
      {children}
      <span className="control-tooltip__bubble" role="tooltip">
        {label}
      </span>
    </span>
  );
}
