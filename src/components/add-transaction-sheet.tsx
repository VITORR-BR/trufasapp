'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useToast } from '@/hooks/use-toast';
import { addTransaction, getClientes } from '@/lib/db';
import type { Cliente } from '@/lib/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Loader2 } from 'lucide-react';

const fiadoSchema = z.object({
  name: z.string().min(1, 'Nome do cliente é obrigatório.'),
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que R$ 0,00.'),
  date: z.string().nonempty('A data é obrigatória.'),
});

const pagamentoSchema = z.object({
  name: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que R$ 0,00.'),
  date: z.string().nonempty('A data é obrigatória.'),
});

function FiadoForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    getClientes().then(setClientes);
  }, []);

  const form = useForm<z.infer<typeof fiadoSchema>>({
    resolver: zodResolver(fiadoSchema),
    defaultValues: {
      name: '',
      amount: undefined,
      date: new Date().toISOString().substring(0, 10),
    },
  });

  async function onSubmit(values: z.infer<typeof fiadoSchema>) {
    try {
      await addTransaction({
        type: 'fiado',
        name: values.name,
        amount: values.amount,
        date: new Date(values.date),
      });
      toast({
        title: 'Sucesso!',
        description: 'Compra fiada salva.',
      });
      form.reset();
      setOpen(false);
      // NOTE: We should revalidate data on other pages, but for now this is fine.
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Ocorreu um problema ao salvar. Tente novamente.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do cliente</FormLabel>
              <FormControl>
                <>
                  <Input
                    list="clientes-list"
                    placeholder="Nome do cliente"
                    {...field}
                  />
                  <datalist id="clientes-list">
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.name} />
                    ))}
                  </datalist>
                </>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <Input type="number" placeholder="R$ 0,00" {...field} step="0.01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <SheetFooter className="pt-4">
            <SheetClose asChild>
                <Button variant="secondary" type="button" className="w-full">Cancelar</Button>
            </SheetClose>
            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full bg-primary text-primary-foreground">
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}

function PagamentoForm({ setOpen }: { setOpen: (open: boolean) => void }) {
    const { toast } = useToast();
    const [clientes, setClientes] = useState<Cliente[]>([]);

    useEffect(() => {
      getClientes().then(setClientes);
    }, []);

    const form = useForm<z.infer<typeof pagamentoSchema>>({
      resolver: zodResolver(pagamentoSchema),
      defaultValues: {
        name: '',
        amount: undefined,
        date: new Date().toISOString().substring(0, 10),
      },
    });

    async function onSubmit(values: z.infer<typeof pagamentoSchema>) {
      try {
        await addTransaction({
          type: 'pagamento',
          name: values.name || '',
          amount: values.amount,
          date: new Date(values.date),
        });
        toast({
          title: 'Sucesso!',
          description: 'Pagamento salvo.',
        });
        form.reset();
        setOpen(false);
        // NOTE: We should revalidate data on other pages, but for now this is fine.
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: 'Ocorreu um problema ao salvar. Tente novamente.',
        });
      }
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do cliente (opcional)</FormLabel>
                <FormControl>
                  <>
                    <Input
                      list="clientes-list-pagamento"
                      placeholder="Nome do cliente (opcional)"
                      {...field}
                    />
                    <datalist id="clientes-list-pagamento">
                      {clientes.map(cliente => (
                        <option key={cliente.id} value={cliente.name} />
                      ))}
                    </datalist>
                  </>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="R$ 0,00" {...field} step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SheetFooter className="pt-4">
              <SheetClose asChild>
                  <Button variant="secondary" type="button" className="w-full">Cancelar</Button>
              </SheetClose>
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full bg-primary text-primary-foreground">
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
          </SheetFooter>
        </form>
      </Form>
    );
  }

export default function AddTransactionSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('fiado');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-lg max-w-md mx-auto">
        <SheetHeader>
          <SheetTitle>Adicionar Lançamento</SheetTitle>
        </SheetHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fiado">Compra Fiada</TabsTrigger>
            <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
          </TabsList>
          <TabsContent value="fiado">
            <FiadoForm setOpen={setOpen} />
          </TabsContent>
          <TabsContent value="pagamento">
            <PagamentoForm setOpen={setOpen} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
