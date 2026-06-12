type DownloadIconProps = {
  className?: string;
};

export function DownloadIcon({ className }: DownloadIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M5 20h14v-2H5v2zm7-18h-2v9H8l4 4 4-4h-2V2z" />
    </svg>
  );
}
