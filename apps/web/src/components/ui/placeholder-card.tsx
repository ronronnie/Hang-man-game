import type { ReactNode } from "react";

interface PlaceholderCardProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function PlaceholderCard({ title, description, children }: PlaceholderCardProps) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>
      {children}
    </section>
  );
}
