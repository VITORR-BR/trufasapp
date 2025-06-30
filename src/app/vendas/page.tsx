'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BadgePercent } from 'lucide-react';
import Link from 'next/link';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getAllTransactions } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';

export default function VendasPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getAllTransactions();
      setTransactions(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  const totalMonthSales = transactions.reduce((acc, sale) => {
    const now = new Date();
    const saleDate = new Date(sale.date);
    if (sale.type === 'pagamento' && saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()) {
      return acc + sale.amount;
    }
    return acc;
  }, 0);

  const recentSales = transactions.slice(0, 10);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Total Vendido no Mês</CardTitle>
          <CardDescription>Soma de todos os pagamentos recebidos.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-9 w-36" /> : <p className="text-3xl font-bold">{formatCurrency(totalMonthSales)}</p>}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Últimas Transações</h2>
        <Button variant="ghost" asChild>
          <Link href="/relatorio">Ver todas <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
      
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recentSales.map((sale: Transaction) => (
            <Card key={sale.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-full">
                  <BadgePercent className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-medium">{sale.person || 'Pagamento Avulso'}</p>
                  <p className="text-sm text-muted-foreground">{sale.date.toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <p className={cn(
                  "font-semibold",
                  sale.type === 'fiado' ? 'text-destructive' : 'text-green-500'
                )}>
                {sale.type === 'fiado' ? '-' : '+'} {formatCurrency(sale.amount)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
