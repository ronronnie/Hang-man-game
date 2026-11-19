import type { CategoryIcon as CategoryIconKey } from "@hangman/game-core";

export function CategoryIcon({ icon }: { icon: CategoryIconKey }) {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {getIconPaths(icon)}
    </svg>
  );
}

function getIconPaths(icon: CategoryIconKey) {
  switch (icon) {
    case "film":
      return <path d="M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M16 9h4M4 15h4M16 15h4" />;
    case "television":
      return <path d="M4 7h16v11H4zM9 3l3 4 3-4M8 21h8" />;
    case "music-note":
      return <path d="M9 18V6l10-2v12M9 10l10-2M6.5 21A2.5 2.5 0 1 0 6.5 16 2.5 2.5 0 0 0 6.5 21ZM16.5 19A2.5 2.5 0 1 0 16.5 14 2.5 2.5 0 0 0 16.5 19Z" />;
    case "game-controller":
      return <path d="M7 9h10a4 4 0 0 1 3.7 5.5l-1.2 3A2.4 2.4 0 0 1 15.7 19l-2-1.5h-3.4l-2 1.5a2.4 2.4 0 0 1-3.8-1.5l-1.2-3A4 4 0 0 1 7 9ZM8 12v4M6 14h4M16.5 13h.01M18 15h.01" />;
    case "trophy":
      return <path d="M8 4h8v4a4 4 0 0 1-8 0V4ZM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6" />;
    case "globe":
      return <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>;
    case "flask":
      return <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3M7.5 15h9" />;
    case "book-open":
      return <path d="M3 5.5A7 7 0 0 1 12 8v12a7 7 0 0 0-9-2.5v-12ZM21 5.5A7 7 0 0 0 12 8v12a7 7 0 0 1 9-2.5v-12Z" />;
    case "lightbulb":
      return <path d="M9 18h6M10 22h4M8.5 15.5A7 7 0 1 1 15.5 15.5c-.9.7-1.5 1.4-1.5 2.5h-4c0-1.1-.6-1.8-1.5-2.5Z" />;
    case "sparkles":
      return <path d="m12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15ZM5 14l.7 1.8 1.8.7-1.8.7L5 19l-.7-1.8-1.8-.7 1.8-.7L5 14Z" />;
    default:
      return <circle cx="12" cy="12" r="8" />;
  }
}
