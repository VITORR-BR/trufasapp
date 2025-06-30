'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BadgePercent } from 'lucide-react';
import Link from 'next/link';
import { recentSales } from '@/lib/data';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function VendasPage() {
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
  const totalMonthSales = recentSales.reduce((acc, sale) => acc + (sale.type === 'pagamento' ? sale.amount : 0), 250); // mock base value

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Total Vendido no Mês</CardTitle>
          <CardDescription>Soma de todos os pagamentos recebidos.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(totalMonthSales)}</p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Últimas Vendas</h2>
        <Button variant="ghost" asChild>
          <Link href="/relatorio">Ver todas <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
      
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
    </div>
  );
}
