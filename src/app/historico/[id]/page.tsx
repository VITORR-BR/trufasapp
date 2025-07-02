'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Edit, Plus, MinusCircle, Loader2, X, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import type { Transaction, Cliente } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getHistorico, updateClienteName } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import AddTransactionSheet from '@/components/add-transaction-sheet';

export default function HistoricoPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        setLoading(true);
        const { history: fetchedHistory, cliente: fetchedCliente } = await getHistorico(id);
        setHistory(fetchedHistory);
        setCliente(fetchedCliente);
        if (fetchedCliente) {
          setNewName(fetchedCliente.name);
        }
        setLoading(false);
      }
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (cliente) {
      setNewName(cliente.name);
    }
  }, [cliente]);

  const handleSaveName = async () => {
    if (!cliente || !newName.trim() || newName.trim() === cliente.name) {
        setIsEditing(false);
        if (cliente) setNewName(cliente.name);
        return;
    }

    setIsSaving(true);
    try {
        await updateClienteName(id, newName.trim());
        setCliente(prev => (prev ? { ...prev, name: newName.trim() } : null));
        toast({ title: 'Sucesso!', description: 'Nome do cliente atualizado.' });
    } catch (error) {
        console.error("Failed to update name:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o nome.' });
    } finally {
        setIsSaving(false);
        setIsEditing(false);
    }
  };


  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="p-4 flex items-center gap-4 border-b">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/pendentes"><ArrowLeft /></Link>
          </Button>
          <Skeleton className="h-6 w-32" />
        </header>
        <div className="flex-1 p-4 md:p-6 space-y-4">
            <Card><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
            <Skeleton className="h-6 w-48 mt-4 mb-2" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
        </div>
      </div>
    )
  }

  if (!cliente) {
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
        {isEditing ? (
            <div className="flex-1 flex items-center gap-2">
                <Input 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <Button onClick={handleSaveName} disabled={isSaving} size="sm">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                </Button>
            </div>
        ) : (
            <h1 className="text-xl font-bold tracking-tight flex-1">{cliente.name}</h1>
        )}
        <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? <X className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
        </Button>
      </header>
      
      <div className="flex-1 p-4 md:p-6 space-y-4 pb-24">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Saldo Devedor</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalDebt)}</p>
          </CardContent>
        </Card>
      
        <h2 className="text-lg font-semibold">Histórico de Transações</h2>
        {history.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma transação encontrada.</p>
        ) : (
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
        )}
      </div>

      <AddTransactionSheet clienteId={cliente.id} clienteName={cliente.name}>
        <Button className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40">
          <Plus className="h-6 w-6" />
          <span className="sr-only">Adicionar Lançamento</span>
        </Button>
      </AddTransactionSheet>

    </div>
  );
}
