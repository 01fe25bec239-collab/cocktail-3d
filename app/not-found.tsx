import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-sans">
      <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-200 to-neutral-500 mb-6">
        404
      </h1>
      <p className="text-xl md:text-2xl text-neutral-400 font-medium tracking-wide mb-8">
        This cocktail isn&apos;t on the menu.
      </p>
      <Link 
        href="/"
        className="px-8 py-3 rounded-full bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 transition-colors text-white font-medium"
      >
        Return Home
      </Link>
    </div>
  );
}
