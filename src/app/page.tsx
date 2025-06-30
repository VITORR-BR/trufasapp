'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import AddTransactionSheet from '@/components/add-transaction-sheet';
import { useEffect, useState } from 'react';
import { getDebtors, getAllTransactions } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [soldToday, setSoldToday] = useState(0);
  const [toReceive, setToReceive] = useState(0);
  const [salesTrend, setSalesTrend] = useState<{date: string, total: number}[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [debtors, transactions] = await Promise.all([getDebtors(), getAllTransactions()]);
      
      const totalToReceive = debtors.reduce((sum, d) => sum + d.debt, 0);
      setToReceive(totalToReceive);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const totalSoldToday = transactions
        .filter(t => t.type === 'pagamento' && t.date >= today)
        .reduce((sum, t) => sum + t.amount, 0);
      setSoldToday(totalSoldToday);

      const trendData: {[key: string]: number} = {};
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayKey = days[d.getDay()];
        trendData[dayKey] = 0;
      }

      transactions.forEach(t => {
        const d = new Date(t.date);
        const todayRef = new Date();
        const diffDays = Math.floor((todayRef.getTime() - d.getTime()) / (1000 * 3600 * 24));
        if (diffDays < 7 && t.type === 'pagamento') {
          const dayKey = days[d.getDay()];
          trendData[dayKey] = (trendData[dayKey] || 0) + t.amount;
        }
      });

      setSalesTrend(Object.entries(trendData).map(([date, total]) => ({ date, total })));

      setLoading(false);
    }
    fetchData();
  }, []);

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resumo</h1>
          <p className="text-muted-foreground">Visão geral das suas vendas.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/vendas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendido Hoje</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">{formatCurrency(soldToday)}</div>}
            </CardContent>
          </Card>
        </Link>
        <Link href="/pendentes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Receber</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold text-destructive">{formatCurrency(toReceive)}</div>}
            </CardContent>
          </Card>
        </Link>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Saldo (7d)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {loading ? (
                <div className="flex h-[250px] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={250}>
                <BarChart data={salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    />
                    <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                    />
                    <Tooltip
                    cursor={{ fill: 'hsl(var(--accent))' }}
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                    }}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      
      <AddTransactionSheet>
        <Button className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40">
          <Plus className="h-6 w-6" />
          <span className="sr-only">Adicionar Lançamento</span>
        </Button>
      </AddTransactionSheet>
    </div>
  );
}
