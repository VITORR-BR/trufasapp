import type { Debtor, Transaction } from './types';

export const summaryData = {
  soldToday: 75.50,
  toReceive: 342.00,
};

export const salesTrend = [
  { date: 'Seg', total: 50 },
  { date: 'Ter', total: 75 },
  { date: 'Qua', total: 60 },
  { date: 'Qui', total: 90 },
  { date: 'Sex', total: 120 },
  { date: 'Sáb', total: 150 },
  { date: 'Dom', total: 75.50 },
];

export const recentSales: Transaction[] = [
  { id: '1', type: 'fiado', person: 'Ana Silva', date: new Date(new Date().setDate(new Date().getDate() - 1)), amount: 25.00 },
  { id: '2', type: 'pagamento', person: 'Carlos Lima', date: new Date(new Date().setDate(new Date().getDate() - 1)), amount: 50.00 },
  { id: '3', type: 'fiado', person: 'Mariana Costa', date: new Date(new Date().setDate(new Date().getDate() - 2)), amount: 15.50 },
  { id: '4', type: 'fiado', person: 'João Pereira', date: new Date(new Date().setDate(new Date().getDate() - 2)), amount: 35.00 },
  { id: '5', type: 'pagamento', person: 'Ana Silva', date: new Date(new Date().setDate(new Date().getDate() - 3)), amount: 10.00 },
];

export const debtors: Debtor[] = [
  { id: '1', name: 'Ana Silva', debt: 85.50 },
  { id: '2', name: 'Bruno Costa', debt: 50.00 },
  { id: '3', name: 'Carla Dias', debt: 22.00 },
  { id: '4', name: 'Daniel Alves', debt: 120.00 },
  { id: '5', name: 'Eduarda Lima', debt: 15.00 },
  { id: '6', name: 'Felipe Souza', debt: 34.50 },
  { id: '7', name: 'Gabriela Mota', debt: 15.00 },
];

const today = new Date();
export const fullHistory: Record<string, Transaction[]> = {
  '1': [
    { id: 'h1', type: 'fiado', person: 'Ana Silva', date: new Date(new Date().setDate(today.getDate() - 10)), amount: 30.00 },
    { id: 'h2', type: 'fiado', person: 'Ana Silva', date: new Date(new Date().setDate(today.getDate() - 8)), amount: 55.50 },
    { id: 'h3', type: 'pagamento', person: 'Ana Silva', date: new Date(new Date().setDate(today.getDate() - 5)), amount: 30.00 },
    { id: 'h4', type: 'fiado', person: 'Ana Silva', date: new Date(new Date().setDate(today.getDate() - 2)), amount: 30.00 },
  ],
};

export const reportData: Transaction[] = [
  ...recentSales,
  { id: '6', type: 'fiado', person: 'Bruno Costa', date: new Date(new Date().setDate(new Date().getDate() - 4)), amount: 50.00 },
  { id: '7', type: 'fiado', person: 'Carla Dias', date: new Date(new Date().setDate(new Date().getDate() - 5)), amount: 22.00 },
  { id: '8', type: 'fiado', person: 'Daniel Alves', date: new Date(new Date().setDate(new Date().getDate() - 6)), amount: 120.00 },
  { id: '9', type: 'fiado', person: 'Eduarda Lima', date: new Date(new Date().setDate(new Date().getDate() - 7)), amount: 15.00 },
  { id: '10', type: 'pagamento', person: 'Daniel Alves', date: new Date(new Date().setDate(new Date().getDate() - 7)), amount: 60.00 },
];
