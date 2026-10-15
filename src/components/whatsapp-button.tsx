import { WHATSAPP_URL } from "@/lib/contact";

export function WhatsappButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="וואטסאפ — 050-4001575"
      title="וואטסאפ 050-4001575"
      className={`grid size-10 shrink-0 place-items-center rounded-full border border-border text-foreground transition-colors hover:border-gold/60 hover:text-gold active:scale-95 ${className}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-[18px] fill-current">
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.29-.77.95-.94 1.15-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.29-.02-.45.13-.6.13-.13.3-.35.45-.52.15-.17.2-.29.3-.49.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.29-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.71 2-1.4.25-.69.25-1.28.17-1.4-.07-.12-.27-.2-.57-.35Z" />
        <path d="M12.04 2.5A9.46 9.46 0 0 0 3.9 16.78L2.5 21.5l4.85-1.37a9.46 9.46 0 1 0 4.69-17.63Zm0 1.84a7.62 7.62 0 1 1-3.88 14.17l-.28-.16-2.88.81.79-2.8-.18-.29A7.62 7.62 0 0 1 12.04 4.34Z" />
      </svg>
    </a>
  );
}
