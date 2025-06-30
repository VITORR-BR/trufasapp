'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Resumo', icon: Home },
  { href: '/vendas', label: 'Vendas', icon: BarChart2 },
  { href: '/pendentes', label: 'Pendentes', icon: Users },
  { href: '/relatorio', label: 'Relatório', icon: FileText },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 h-16 w-full -translate-x-1/2 max-w-md border-t border-border bg-background/90 backdrop-blur-sm">
      <div className="flex h-full items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground',
                isActive && 'text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
