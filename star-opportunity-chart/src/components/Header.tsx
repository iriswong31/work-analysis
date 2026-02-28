import { Star } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-primary-light to-primary px-4 sm:px-6 py-3 sm:py-4 shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <Star className="w-6 h-6 sm:w-8 sm:h-8 text-accent fill-accent animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-secondary rounded-full animate-ping" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            星级机会图
          </h1>
        </div>
      </div>
    </header>
  );
}
