import { getInitials } from "@/lib/ui";

type ParticipantAvatarProps = {
  name: string;
  photoUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-12 text-sm",
  lg: "size-16 text-base",
};

export function ParticipantAvatar({
  name,
  photoUrl,
  size = "md",
  className = "",
}: ParticipantAvatarProps) {
  const sizeClass = sizeClasses[size];

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={`${name} profile`}
        className={`rounded-full object-cover ${sizeClass} ${className}`}
        src={photoUrl}
      />
    );
  }

  return (
    <span
      className={`flex items-center justify-center rounded-full bg-accent-soft font-bold text-accent ${sizeClass} ${className}`}
    >
      {getInitials(name)}
    </span>
  );
}
