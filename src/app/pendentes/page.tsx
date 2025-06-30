'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, User } from 'lucide-react';
import Link from 'next/link';
import { debtors } from '@/lib/data';
import AddTransactionSheet from '@/components/add-transaction-sheet';

export default function PendentesPage() {
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pendentes</h1>
        <p className="text-sm text-muted-foreground">{debtors.length} devedores</p>
      </div>

      <div className="flex flex-col gap-3">
        {debtors.sort((a,b) => b.debt - a.debt).map(debtor => (
          <Link href={`/historico/${debtor.id}`} key={debtor.id}>
            <Card className="hover:bg-accent transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{debtor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{debtor.name}</p>
                </div>
                <p className="font-semibold text-destructive">{formatCurrency(debtor.debt)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
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
