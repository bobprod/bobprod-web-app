export function Footer() {
  return (
    <footer className="mx-auto mt-24 w-[min(1100px,92vw)] border-t border-white/10 py-10 text-center text-xs text-white/60">
      <p>&copy; {new Date().getFullYear()} bobprod. All rights reserved.</p>
      <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <a href="/privacy" className="hover:text-white/60">
          Privacy Policy
        </a>
        <a href="/terms" className="hover:text-white/60">
          Terms of Service
        </a>
        <a href="/legal" className="hover:text-white/60">
          Legal Notice
        </a>
      </p>
    </footer>
  );
}
