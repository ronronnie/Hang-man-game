import Link from "next/link";

export function HomeScreen() {
  return (
    <div className="flex flex-1 flex-col items-start justify-center py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent)]">Project foundation</p>
      <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
        A familiar word game, ready to evolve.
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
        The web client is running on a platform-independent domain foundation prepared for a future Expo app.
      </p>
      <Link className="mt-8 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black" href="/play">
        View game setup
      </Link>
    </div>
  );
}
