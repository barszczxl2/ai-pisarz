'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

function getBreadcrumbs(pathname: string) {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];

  let currentPath = '';
  for (const path of paths) {
    currentPath += `/${path}`;
    let name = path;

    // Translate path segments to Polish
    switch (path) {
      case 'projects':
        name = 'Projekty';
        break;
      case 'new':
        name = 'Nowy';
        break;
      case 'content':
        name = 'Treść';
        break;
      case 'settings':
        name = 'Ustawienia';
        break;
      default:
        // Keep UUIDs as is or shorten them
        if (path.length > 20) {
          name = path.substring(0, 8) + '...';
        }
    }

    breadcrumbs.push({
      name,
      href: currentPath,
    });
  }

  return breadcrumbs;
}

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  if (pathname === '/projects') return 'Projekty';
  if (pathname === '/projects/new') return 'Nowy Projekt';
  if (pathname === '/settings') return 'Ustawienia';
  if (pathname.includes('/projects/') && pathname.includes('/content')) {
    return 'Treść Artykułu';
  }
  if (pathname.includes('/projects/')) return 'Szczegóły Projektu';
  return 'AI PISARZ';
}

export function Header() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">{pageTitle}</h1>
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-700">
              <Home className="h-3.5 w-3.5" />
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-slate-700">{crumb.name}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-slate-700">
                    {crumb.name}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
