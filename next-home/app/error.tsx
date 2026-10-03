"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
    <h1 className="heading-h1 text-primary">Page content unavailable.</h1>
    <button onClick={reset} className="rounded-full bg-primary px-6 py-3 text-white">Try again</button>
  </main>;
}
