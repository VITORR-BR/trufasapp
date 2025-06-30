export interface Transaction {
  id: string;
  type: 'fiado' | 'pagamento';
  person?: string;
  date: Date;
  amount: number;
}

export interface Debtor {
  id: string;
  name: string;
  debt: number;
}
