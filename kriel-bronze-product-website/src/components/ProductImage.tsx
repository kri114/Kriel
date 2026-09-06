import { cn } from "@/lib/cn";

/**
 * Imazh produkti me sfond të mjegullt — duket premium si për foto
 * katalogu me sfond transparent, ashtu edhe për fotografi të plota.
 */
export default function ProductImage({
  src,
  alt,
  className,
  backdropClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  backdropClassName?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-ink-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        loading="lazy"
        className={cn(
          "card-img absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-70 blur-[2px] brightness-[0.85]",
          backdropClassName
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-ink/25" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="card-img relative h-full w-full object-cover object-center"
      />
    </div>
  );
}
