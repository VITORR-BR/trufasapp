'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function TransactionForm({ type }: { type: 'fiado' | 'pagamento' }) {
  const isCreditSale = type === 'fiado';
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" placeholder={isCreditSale ? "Nome do cliente (obrigatório)" : "Nome do cliente (opcional)"} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Valor</Label>
        <Input id="amount" type="number" placeholder="R$ 0,00" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="date">Data</Label>
        <Input id="date" type="date" defaultValue={new Date().toISOString().substring(0, 10)} />
      </div>
    </div>
  );
}

export default function AddTransactionSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-lg max-w-md mx-auto">
        <SheetHeader>
          <SheetTitle>Adicionar Lançamento</SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="fiado" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fiado">Compra Fiada</TabsTrigger>
            <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
          </TabsList>
          <TabsContent value="fiado">
            <TransactionForm type="fiado" />
          </TabsContent>
          <TabsContent value="pagamento">
            <TransactionForm type="pagamento" />
          </TabsContent>
        </Tabs>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="secondary" className="w-full">Cancelar</Button>
          </SheetClose>
          <Button type="submit" className="w-full bg-primary text-primary-foreground">Salvar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
