'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { reportData } from '@/lib/data';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';

export default function RelatorioPage() {
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  const renderRow = (item: Transaction) => (
    <TableRow key={item.id}>
      <TableCell>
        <div className="font-medium">{item.person || 'N/A'}</div>
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Relatório</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          EXPORTAR
        </Button>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Tudo</TabsTrigger>
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="7days">7 dias</TabsTrigger>
          <TabsTrigger value="30days">30 dias</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente/Data</TableHead>
                <TableHead className="text-right">Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map(renderRow)}
            </TableBody>
          </Table>
        </TabsContent>
        {/* Other tabs would have filtered data */}
      </Tabs>
    </div>
  );
}
