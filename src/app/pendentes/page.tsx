'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import AddTransactionSheet from '@/components/add-transaction-sheet';
import type { Debtor } from '@/lib/types';
import { getDebtors } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function PendentesPage() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'debt' | 'name'>('debt');

  useEffect(() => {
    const fetchDebtors = async () => {
      setLoading(true);
      const data = await getDebtors();
      setDebtors(data);
      setLoading(false);
    };
    fetchDebtors();
  }, []);

  const sortedDebtors = useMemo(() => {
    return [...debtors].sort((a, b) => {
      if (sortOrder === 'name') {
        return a.name.localeCompare(b.name);
      }
      // Default sort by 'debt'
      return b.debt - a.debt;
    });
  }, [debtors, sortOrder]);

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pendentes</h1>
        <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{loading ? '...' : `${debtors.length} devedores`}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <ArrowUpDown className="h-4 w-4" />
                  <span>Ordenar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortOrder('debt')}>
                  Maior Dívida
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder('name')}>
                  Nome (A-Z)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-5 w-32" />
                  </div>
                  <Skeleton className="h-5 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : debtors.length === 0 ? (
        <div className="text-center text-muted-foreground mt-8">
            <p>Nenhum cliente com saldo devedor.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedDebtors.map(debtor => (
            <Link href={`/historico/${debtor.id}`} key={debtor.id}>
              <Card className="hover:bg-accent transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>{debtor.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{debtor.name}</p>
                  </div>
                  <p className="font-semibold text-destructive">{formatCurrency(debtor.debt)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      
      <AddTransactionSheet>
        <Button className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40">
          <Plus className="h-6 w-6" />
          <span className="sr-only">Adicionar Lançamento</span>
        </Button>
      </AddTransactionSheet>
    </div>
  );
}
