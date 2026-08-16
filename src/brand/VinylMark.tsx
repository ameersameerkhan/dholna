import { VinylRecordIcon } from "@phosphor-icons/react";

type VinylMarkProps = {
  size?: number;
  className?: string;
};

export function VinylMark({ size = 32, className = "" }: VinylMarkProps) {
  return (
    <span className={`brand-vinyl ${className}`.trim()} aria-hidden="true">
      <VinylRecordIcon size={size} weight="light" />
    </span>
  );
}
