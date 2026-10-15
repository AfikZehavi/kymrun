import { useRef, useState, type ImgHTMLAttributes } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = ImgHTMLAttributes<HTMLImageElement> & { containerClassName?: string | undefined };

export function ProductImage({ src, alt, className, containerClassName, ...props }: Props) {
  return <ImageState key={src} src={src} alt={alt} className={className} containerClassName={containerClassName} {...props} />;
}

function ImageState({ src, alt, className, containerClassName, ...props }: Props) {
  const image = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<"loading" | "loaded" | "error">(src ? "loading" : "error");
  return (
    <div className={cn("relative overflow-hidden bg-photo", containerClassName)} aria-busy={state === "loading"}>
      {state !== "loaded" && (
        <div className="absolute inset-0 grid place-items-center text-muted-foreground" role="status" aria-label={state === "loading" ? "טוען תמונה" : "התמונה אינה זמינה"}>
          {state === "loading" ? <Loader2 className="size-6 animate-spin motion-reduce:animate-none" /> : <ImageOff className="size-6" />}
        </div>
      )}
      {src && <img {...props} ref={(element) => {
        image.current = element;
        if (element?.complete && element.naturalWidth > 0) setState("loaded");
      }} src={src} alt={alt} onLoad={() => setState("loaded")} onError={() => setState("error")}
        className={cn("h-full w-full object-contain p-3 mix-blend-multiply transition-opacity duration-300 motion-reduce:transition-none", className, state === "loaded" ? "opacity-100" : "opacity-0")} />}
    </div>
  );
}