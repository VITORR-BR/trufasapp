import type { Timestamp } from 'firebase/firestore';

export interface Transaction {
  id: string;
  type: 'fiado' | 'pagamento';
  person?: string;
  personId?: string;
  date: Date;
  amount: number;
}

export interface Debtor {
  id: string;
  name: string;
  debt: number;
}

export interface Cliente {
  id: string;
  name: string;
}

export interface HistoricoItem {
  id: string;
  data: Timestamp;
  tipo: 'fiado' | 'pagamento';
  valor: number;
}
