
'use client';

import { useEffect, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
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
import { addTransaction, getClientesWithDebts } from '@/lib/db';
import type { ClienteWithDebt } from '@/lib/types';
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

type FiadoSchema = z.infer<typeof fiadoSchema>;
type PagamentoSchema = z.infer<typeof pagamentoSchema>;


const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

function FiadoForm({ setOpen, form }: { setOpen: (open: boolean) => void; form: UseFormReturn<FiadoSchema> }) {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<ClienteWithDebt[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<ClienteWithDebt[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    getClientesWithDebts().then(setClientes);
  }, []);

  const watchName = form.watch('name');

  useEffect(() => {
    if (watchName && showSuggestions) {
      const filtered = clientes.filter(c =>
        c.name.toLowerCase().includes(watchName.toLowerCase())
      );
      setFilteredClientes(filtered);
    } else {
      setFilteredClientes([]);
    }
  }, [watchName, clientes, showSuggestions]);

  const handleSelectCliente = (cliente: ClienteWithDebt) => {
    form.setValue('name', cliente.name);
    setShowSuggestions(false);
  };

  async function onSubmit(values: FiadoSchema) {
    try {
      await addTransaction({
        type: 'fiado',
        name: values.name,
        amount: values.amount,
        date: new Date(values.date + 'T12:00:00'),
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
                    id="fiado-name-input"
                    placeholder="Nome do cliente"
                    {...field}
                    autoComplete="off"
                    onFocus={() => {
                        setShowSuggestions(true);
                        window.scrollTo(0, document.body.scrollHeight);
                    }}
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
                <Input type="number" placeholder="R$ 0,00" {...field} step="0.01" autoComplete="off" />
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
            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full bg-primary text-primary-foreground">
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}

function PagamentoForm({ setOpen, form }: { setOpen: (open: boolean) => void; form: UseFormReturn<PagamentoSchema> }) {
    const { toast } = useToast();
    const [clientes, setClientes] = useState<ClienteWithDebt[]>([]);
    const [filteredClientes, setFilteredClientes] = useState<ClienteWithDebt[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
      getClientesWithDebts().then(setClientes);
    }, []);

    const watchName = form.watch('name');

    useEffect(() => {
        if (watchName && showSuggestions) {
          const filtered = clientes.filter(c =>
            c.name.toLowerCase().includes(watchName.toLowerCase())
          );
          setFilteredClientes(filtered);
        } else {
          setFilteredClientes([]);
        }
      }, [watchName, clientes, showSuggestions]);
    
    const handleSelectCliente = (cliente: ClienteWithDebt) => {
        form.setValue('name', cliente.name);
        setShowSuggestions(false);
    };

    async function onSubmit(values: PagamentoSchema) {
      try {
        await addTransaction({
          type: 'pagamento',
          name: values.name || '',
          amount: values.amount,
          date: new Date(values.date + 'T12:00:00'),
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
                        id="pagamento-name-input"
                        placeholder="Nome do cliente"
                        {...field}
                        autoComplete="off"
                        onFocus={() => {
                            setShowSuggestions(true);
                            window.scrollTo(0, document.body.scrollHeight);
                        }}
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
                  <Input type="number" placeholder="R$ 0,00" {...field} step="0.01" autoComplete="off" />
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
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full bg-primary text-primary-foreground">
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
          </SheetFooter>
        </form>
      </Form>
    );
  }

export default function AddTransactionSheet({ children, defaultTab = 'fiado' }: { children: React.ReactNode, defaultTab?: 'fiado' | 'pagamento' }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const defaultValues = {
    name: '',
    amount: '' as any,
    date: new Date().toISOString().substring(0, 10),
  };

  const fiadoForm = useForm<FiadoSchema>({
    resolver: zodResolver(fiadoSchema),
    defaultValues,
  });

  const pagamentoForm = useForm<PagamentoSchema>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    } else {
      fiadoForm.reset(defaultValues);
      pagamentoForm.reset(defaultValues);
    }
  }, [open, defaultTab, fiadoForm, pagamentoForm]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const inputId = activeTab === 'fiado' ? 'fiado-name-input' : 'pagamento-name-input';
        const inputElement = document.getElementById(inputId);
        inputElement?.focus();
      }, 150);
    }
  }, [open, activeTab]);

  const handleTabChange = (newTab: string) => {
    if (newTab === 'pagamento') {
      const { name, amount, date } = fiadoForm.getValues();
      pagamentoForm.setValue('name', name || '');
      pagamentoForm.setValue('amount', amount);
      pagamentoForm.setValue('date', date);
    } else if (newTab === 'fiado') {
      const { name, amount, date } = pagamentoForm.getValues();
      fiadoForm.setValue('name', name || '');
      fiadoForm.setValue('amount', amount);
      fiadoForm.setValue('date', date);
    }
    setActiveTab(newTab);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-lg max-w-md mx-auto">
        <SheetHeader>
          <SheetTitle>Adicionar Lançamento</SheetTitle>
        </SheetHeader>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fiado">Compra Fiada</TabsTrigger>
            <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
          </TabsList>
          <TabsContent value="fiado">
            <FiadoForm setOpen={setOpen} form={fiadoForm} />
          </TabsContent>
          <TabsContent value="pagamento">
            <PagamentoForm setOpen={setOpen} form={pagamentoForm} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
