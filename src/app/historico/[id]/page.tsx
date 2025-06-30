'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Edit, PlusCircle, MinusCircle } from 'lucide-react';
import Link from 'next/link';
import { debtors, fullHistory } from '@/lib/data';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function HistoricoPage() {
  const params = useParams();
  const id = params.id as string;
  
  const debtor = debtors.find(d => d.id === id);
  const history = fullHistory[id] || [];

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  if (!debtor) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6">
        <p>Usuário não encontrado.</p>
        <Button asChild>
          <Link href="/pendentes">Voltar</Link>
        </Button>
      </div>
    );
  }

  const totalDebt = history.reduce((acc, t) => {
    return t.type === 'fiado' ? acc + t.amount : acc - t.amount;
  }, 0);

  return (
    <div className="flex flex-1 flex-col">
      <header className="p-4 flex items-center gap-4 border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pendentes"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">{debtor.name}</h1>
        <Button variant="ghost" size="icon">
          <Edit className="h-5 w-5" />
        </Button>
      </header>
      
      <div className="flex-1 p-4 md:p-6 space-y-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Saldo Devedor</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalDebt)}</p>
          </CardContent>
        </Card>
      
        <h2 className="text-lg font-semibold">Histórico de Transações</h2>
        <div className="space-y-3">
          {history.map((item: Transaction) => (
            <div key={item.id} className="flex items-center">
              <div className="mr-4">
                {item.type === 'fiado' ? (
                  <MinusCircle className="h-6 w-6 text-destructive" />
                ) : (
                  <PlusCircle className="h-6 w-6 text-green-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium capitalize">{item.type}</p>
                <p className="text-sm text-muted-foreground">{item.date.toLocaleDateString('pt-BR')}</p>
              </div>
              <p className={cn(
                  "font-semibold",
                  item.type === 'fiado' ? 'text-destructive' : 'text-green-500'
                )}
              >
                {formatCurrency(item.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
