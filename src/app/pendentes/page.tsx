'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import AddTransactionSheet from '@/components/add-transaction-sheet';
import type { Debtor } from '@/lib/types';
import { getDebtors } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';

export default function PendentesPage() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDebtors = async () => {
      setLoading(true);
      const data = await getDebtors();
      setDebtors(data);
      setLoading(false);
    };
    fetchDebtors();
  }, []);

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pendentes</h1>
        <p className="text-sm text-muted-foreground">{loading ? '...' : `${debtors.length} devedores`}</p>
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
          {debtors.map(debtor => (
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
