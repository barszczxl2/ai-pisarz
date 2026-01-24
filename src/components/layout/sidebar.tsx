'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  Plus,
  Settings,
  FileText,
  Database,
  Dices,
  TrendingUp,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Główna nawigacja
const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Projekty',
    href: '/projects',
    icon: FolderKanban,
  },
  {
    name: 'Google Trends',
    href: '/trends',
    icon: TrendingUp,
  },
  {
    name: 'Wyszukiwanie semantyczne',
    href: '/semantyka',
    icon: Search,
  },
];

// Ustawienia
const secondaryNavigation = [
  {
    name: 'Ustawienia',
    href: '/settings',
    icon: Settings,
  },
];

// Plany wdrożeń (wyszarzone, z badge "Wkrótce")
const plannedFeatures = [
  {
    name: 'Baza DING',
    href: '/baza-ding',
    icon: Database,
  },
  {
    name: 'Monte Carlo',
    href: '/monte-carlo',
    icon: Dices,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6">
        <FileText className="h-8 w-8 text-blue-400" />
        <span className="text-xl font-bold">AI PISARZ</span>
      </div>

      <Separator className="bg-slate-700" />

      {/* New Project Button */}
      <div className="px-4 py-4">
        <Link href="/projects/new">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Nowy Projekt
          </Button>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1 px-4 py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-slate-700" />

      {/* Secondary Navigation - Ustawienia */}
      <nav className="space-y-1 px-4 py-3">
        {secondaryNavigation.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-slate-700" />

      {/* Planned Features Section */}
      <div className="flex-1 px-4 py-3">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Plany wdrożeń
        </p>
        <nav className="space-y-1">
          {plannedFeatures.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-800 text-slate-400'
                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-400'
                )}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </span>
                <Badge variant="outline" className="border-slate-600 bg-slate-800 text-[10px] text-slate-400">
                  Wkrótce
                </Badge>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 px-4 py-4">
        <p className="text-xs text-slate-400">
          AI PISARZ v1.0
        </p>
      </div>
    </div>
  );
}
