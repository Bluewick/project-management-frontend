import { Link } from 'react-router-dom';
import { ChevronRight, Menu, Search } from 'lucide-react';

/**
 * Sticky top workspace bar with mobile menu toggle, breadcrumbs, and ⌘K search trigger.
 */
export function TopBar({
  breadcrumbs = [],
  onOpenMobileNav,
  onOpenCommandPalette,
}) {
  return (
    <header className="h-14 bg-surface-bright border-b border-outline px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={`${crumb.label}-${idx}`} className="flex items-center gap-1.5 min-w-0">
                {idx > 0 ? (
                  <ChevronRight className="w-3.5 h-3.5 text-on-surface-muted shrink-0" />
                ) : null}
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="text-body-sm font-medium text-on-surface-variant hover:text-on-surface truncate"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={`text-body-sm truncate ${
                      isLast ? 'font-semibold text-on-surface' : 'text-on-surface-variant'
                    }`}
                  >
                    {crumb.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* ⌘ K Search Trigger per DESIGN.MD */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="h-9 w-44 sm:w-64 px-3 rounded-lg bg-surface-container-low border border-outline hover:border-outline-variant hover:bg-surface-container transition-colors flex items-center justify-between gap-2 cursor-pointer"
        >
          <span className="inline-flex items-center gap-2 text-body-sm text-on-surface-muted truncate">
            <Search className="w-4 h-4 shrink-0" />
            <span className="truncate">Search...</span>
          </span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container text-label-sm text-on-surface-variant border border-outline/60">
            ⌘ K
          </kbd>
        </button>
      </div>
    </header>
  );
}
