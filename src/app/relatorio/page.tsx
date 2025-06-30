'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';
import { getAllTransactions } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';

export default function RelatorioPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getAllTransactions();
      setTransactions(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredTransactions = useMemo(() => {
    const dateFiltered = (() => {
      if (activeTab === 'all') return transactions;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (activeTab === 'today') {
        return transactions.filter(t => {
          const transactionDate = new Date(t.date);
          transactionDate.setHours(0,0,0,0);
          return transactionDate.getTime() === today.getTime();
        });
      }
      
      const daysToSubtract = activeTab === '7days' ? 7 : 30;
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - daysToSubtract + 1);
      
      return transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate;
      });
    })();
    
    if (typeFilter === 'all') {
      return dateFiltered;
    }
    return dateFiltered.filter(t => t.type === typeFilter);

  }, [transactions, activeTab, typeFilter]);

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  const handleExport = () => {
    if (filteredTransactions.length === 0) return;

    const headers = 'Data,Nome,Tipo,Valor\n';
    
    const rows = filteredTransactions.map(t => {
      const date = t.date.toLocaleDateString('pt-BR');
      const name = `"${t.person || 'Pagamento Avulso'}"`;
      const type = t.type === 'fiado' ? 'Fiado' : 'Pagamento';
      const value = `${t.amount.toFixed(2).replace('.', ',')}`;
      return [date, name, type, value].join(',');
    }).join('\n');
    
    const csvContent = headers + rows;
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-truffle-track-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderRow = (item: Transaction) => (
    <TableRow key={item.id}>
      <TableCell>
        <div className="font-medium">{item.person || 'Pagamento Avulso'}</div>
        <div className="text-sm text-muted-foreground">{item.date.toLocaleDateString('pt-BR')}</div>
      </TableCell>
      <TableCell className="text-right">
        <span className={cn(
          "font-semibold",
          item.type === 'fiado' ? 'text-destructive' : 'text-green-500'
        )}>
          {item.type === 'fiado' ? 'Fiado' : 'Pagamento'}
        </span>
      </TableCell>
      <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
    </TableRow>
  );
  
  const renderTable = (data: Transaction[]) => {
    if (loading) {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente/Data</TableHead>
              <TableHead className="text-right">Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )
    }
    if (data.length === 0) {
      return <p className="text-center text-muted-foreground mt-8">Nenhuma transação encontrada para este período.</p>;
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente/Data</TableHead>
            <TableHead className="text-right">Tipo</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(renderRow)}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Relatório</h1>
        <Button variant="outline" onClick={handleExport} disabled={loading || filteredTransactions.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          EXPORTAR
        </Button>
      </div>
      
      <div className="space-y-2">
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Tudo</TabsTrigger>
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="7days">7 dias</TabsTrigger>
            <TabsTrigger value="30days">30 dias</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs defaultValue="all" onValueChange={setTypeFilter}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pagamento">Pagamentos</TabsTrigger>
            <TabsTrigger value="fiado">Fiado</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto">
        {renderTable(filteredTransactions)}
      </div>
    </div>
  );
}
