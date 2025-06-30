import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp,
  collectionGroup,
  orderBy,
  documentId,
} from 'firebase/firestore';
import type { Cliente, Debtor, HistoricoItem, Transaction } from './types';

export async function addTransaction(data: {
  type: 'fiado' | 'pagamento';
  name: string;
  amount: number;
  date: Date;
}) {
  const { type, name, amount, date } = data;
  const batch = writeBatch(db);
  const firestoreDate = Timestamp.fromDate(date);

  let clienteId: string | null = null;
  let clienteName: string | null = null;
  
  if (name) {
    clienteName = name;
    const clientesRef = collection(db, 'usuarios');
    const q = query(clientesRef, where('nome', '==', name));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      const newClienteRef = doc(clientesRef);
      batch.set(newClienteRef, { nome: name });
      clienteId = newClienteRef.id;
    } else {
      clienteId = querySnapshot.docs[0].id;
    }
  }

  if (type === 'pagamento') {
    const pagamentosRef = collection(db, 'pagamentos');
    batch.set(doc(pagamentosRef), {
      valor: amount,
      data: firestoreDate,
      ...(clienteId && { clienteId: clienteId }),
      ...(clienteName && { clienteNome: clienteName }),
    });
  }
  
  if (clienteId) {
    const historicoRef = collection(db, `usuarios/${clienteId}/historico`);
    batch.set(doc(historicoRef), {
      tipo: type,
      valor: amount,
      data: firestoreDate,
    });
  }

  await batch.commit();
}

export async function getClientes(): Promise<Cliente[]> {
  const clientesRef = collection(db, 'usuarios');
  const q = query(clientesRef, orderBy('nome'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().nome as string }));
}

export async function getHistorico(clienteId: string): Promise<{ history: Transaction[], cliente: Cliente | null }> {
  const clienteDocRef = doc(db, 'usuarios', clienteId);
  const clienteDoc = await getDoc(clienteDocRef);
  const cliente = clienteDoc.exists() ? { id: clienteDoc.id, name: clienteDoc.data().nome } as Cliente : null;

  const historicoRef = collection(db, `usuarios/${clienteId}/historico`);
  const q = query(historicoRef, orderBy('data', 'desc'));
  const snapshot = await getDocs(q);

  const history = snapshot.docs.map(doc => {
    const data = doc.data() as HistoricoItem;
    return {
      id: doc.id,
      type: data.tipo,
      amount: data.valor,
      date: data.date.toDate(),
      person: cliente?.name,
      personId: cliente?.id,
    } as Transaction;
  });

  return { history, cliente };
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const userCache = new Map<string, string>();
  const fetchUserName = async (id: string) => {
      if (userCache.has(id)) return userCache.get(id);
      if (!id) return 'Pagamento Avulso';
      const userDoc = await getDoc(doc(db, 'usuarios', id));
      const name = userDoc.exists() ? userDoc.data().nome : 'Cliente Deletado';
      userCache.set(id, name);
      return name;
  };
  
  // 1. Get all 'fiado' transactions from historico
  const historicoQuery = query(collectionGroup(db, 'historico'), where('tipo', '==', 'fiado'));
  const historicoSnapshot = await getDocs(historicoQuery);
  const fiadoPromises = historicoSnapshot.docs.map(async (doc) => {
    const data = doc.data();
    const personId = doc.ref.parent.parent!.id;
    const personName = await fetchUserName(personId);
    return {
      id: doc.id,
      type: 'fiado',
      amount: data.valor,
      date: (data.data as Timestamp).toDate(),
      person: personName,
      personId: personId,
    } as Transaction;
  });

  // 2. Get all payments
  const pagamentosQuery = query(collection(db, 'pagamentos'));
  const pagamentosSnapshot = await getDocs(pagamentosQuery);
  const pagamentoPromises = pagamentosSnapshot.docs.map(async (doc) => {
    const data = doc.data();
    const personName = data.clienteNome || await fetchUserName(data.clienteId);
    return {
      id: doc.id,
      type: 'pagamento',
      amount: data.valor,
      date: (data.data as Timestamp).toDate(),
      person: personName,
      personId: data.clienteId,
    } as Transaction;
  });

  const allTransactions = await Promise.all([...fiadoPromises, ...pagamentoPromises]);
  
  return allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getDebtors(): Promise<Debtor[]> {
  const userDebts = new Map<string, number>();

  const historicoQuery = query(collectionGroup(db, 'historico'));
  const historicoSnapshot = await getDocs(historicoQuery);
  
  historicoSnapshot.docs.forEach(doc => {
      const transaction = doc.data();
      const userId = doc.ref.parent.parent!.id;
      const currentDebt = userDebts.get(userId) || 0;
      if (transaction.tipo === 'fiado') {
          userDebts.set(userId, currentDebt + transaction.valor);
      } else {
          userDebts.set(userId, currentDebt - transaction.valor);
      }
  });

  const debtorsData: Debtor[] = [];
  const userIdsWithDebt = Array.from(userDebts.keys()).filter(id => userDebts.get(id)! > 0.001);

  if (userIdsWithDebt.length === 0) return [];
  
  // Firestore 'in' query limit is 30. Chunk if necessary.
  const chunks = [];
  for (let i = 0; i < userIdsWithDebt.length; i += 30) {
      chunks.push(userIdsWithDebt.slice(i, i + 30));
  }

  for (const chunk of chunks) {
      const usersRef = collection(db, 'usuarios');
      const usersQuery = query(usersRef, where(documentId(), 'in', chunk));
      const usersSnapshot = await getDocs(usersQuery);

      usersSnapshot.forEach(doc => {
          debtorsData.push({
              id: doc.id,
              name: doc.data().nome,
              debt: userDebts.get(doc.id)!,
          });
      });
  }
  
  return debtorsData.sort((a, b) => b.debt - a.debt);
}
