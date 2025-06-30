
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
import { addTransaction, getClientesWithDebts, getClientes } from '@/lib/db';
import type { Cliente, ClienteWithDebt } from '@/lib/types';
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

const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

function FiadoForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<ClienteWithDebt[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<ClienteWithDebt[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    getClientesWithDebts().then(setClientes);
  }, []);

  const form = useForm<z.infer<typeof fiadoSchema>>({
    resolver: zodResolver(fiadoSchema),
    defaultValues: {
      name: '',
      amount: '' as any,
      date: new Date().toISOString().substring(0, 10),
    },
  });

  const watchName = form.watch('name');

  useEffect(() => {
    if (watchName) {
      const filtered = clientes.filter(c =>
        c.name.toLowerCase().includes(watchName.toLowerCase())
      );
      setFilteredClientes(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredClientes([]);
      setShowSuggestions(false);
    }
  }, [watchName, clientes]);


  const handleSelectCliente = (cliente: Cliente) => {
    form.setValue('name', cliente.name);
    setShowSuggestions(false);
  };

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
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Ocorreu um problema ao salvar. Tente novamente.',
      });
    }
  }

  const isNewCliente = watchName && !clientes.some(c => c.name.toLowerCase() === watchName.toLowerCase());

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
                <div className="relative">
                   <Input
                    placeholder="Nome do cliente"
                    {...field}
                    autoComplete="off"
                    onFocus={() => watchName && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  />
                  {showSuggestions && (filteredClientes.length > 0 || isNewCliente) && (
                    <ul className="absolute z-20 w-full bg-card border rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                       {filteredClientes.map(cliente => (
                        <li
                          key={cliente.id}
                          className="p-2 hover:bg-accent cursor-pointer text-sm"
                          onMouseDown={() => handleSelectCliente(cliente)}
                        >
                          <div className="flex justify-between items-center">
                            <span>{cliente.name}</span>
                            {cliente.debt > 0 && (
                              <span className="text-destructive font-medium">
                                {formatCurrency(cliente.debt)}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                      {isNewCliente && (
                        <li className="p-2 hover:bg-accent cursor-pointer text-sm"
                            onMouseDown={() => {
                                form.setValue('name', field.value);
                                setShowSuggestions(false);
                            }}
                        >
                            Criar novo cliente: "{field.value}"
                        </li>
                      )}
                    </ul>
                  )}
                </div>
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
    const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
      getClientes().then(setClientes);
    }, []);

    const form = useForm<z.infer<typeof pagamentoSchema>>({
      resolver: zodResolver(pagamentoSchema),
      defaultValues: {
        name: '',
        amount: '' as any,
        date: new Date().toISOString().substring(0, 10),
      },
    });

    const watchName = form.watch('name');

    useEffect(() => {
        if (watchName) {
          const filtered = clientes.filter(c =>
            c.name.toLowerCase().includes(watchName.toLowerCase())
          );
          setFilteredClientes(filtered);
          setShowSuggestions(true);
        } else {
          setFilteredClientes([]);
          setShowSuggestions(false);
        }
      }, [watchName, clientes]);
    
    const handleSelectCliente = (cliente: Cliente) => {
        form.setValue('name', cliente.name);
        setShowSuggestions(false);
    };

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
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: 'Ocorreu um problema ao salvar. Tente novamente.',
        });
      }
    }

    const isNewCliente = watchName && !clientes.some(c => c.name.toLowerCase() === watchName.toLowerCase());

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
                  <div className="relative">
                    <Input
                        placeholder="Nome do cliente"
                        {...field}
                        autoComplete="off"
                        onFocus={() => watchName && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    />
                    {showSuggestions && (filteredClientes.length > 0 || isNewCliente) && (
                        <ul className="absolute z-20 w-full bg-card border rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                        {filteredClientes.map(cliente => (
                            <li
                                key={cliente.id}
                                className="p-2 hover:bg-accent cursor-pointer text-sm"
                                onMouseDown={() => handleSelectCliente(cliente)}
                            >
                                {cliente.name}
                            </li>
                        ))}
                        {isNewCliente && (
                          <li className="p-2 hover:bg-accent cursor-pointer text-sm"
                              onMouseDown={() => {
                                  form.setValue('name', field.value);
                                  setShowSuggestions(false);
                              }}
                          >
                              Criar novo cliente: "{field.value}"
                          </li>
                        )}
                        </ul>
                    )}
                  </div>
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
