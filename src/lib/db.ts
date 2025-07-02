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
  updateDoc,
} from 'firebase/firestore';
import type { Cliente, Debtor, HistoricoItem, Transaction, ClienteWithDebt } from './types';

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
      // Create new client if it doesn't exist
      const newClienteRef = doc(clientesRef);
      batch.set(newClienteRef, { nome: name });
      clienteId = newClienteRef.id;
    } else {
      clienteId = querySnapshot.docs[0].id;
    }
  }

  // Always log payment in the main 'pagamentos' collection for reporting
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
    
    if (type === 'fiado') {
      // For 'fiado', always add to history
      batch.set(doc(historicoRef), {
        tipo: 'fiado',
        valor: amount,
        data: firestoreDate,
      });
    } else { // type is 'pagamento'
      // For payments, check if it clears the debt
      const clientHistoricoSnapshot = await getDocs(query(historicoRef));
      
      let debtBeforePayment = 0;
      clientHistoricoSnapshot.forEach(doc => {
        const t = doc.data();
        if (t.tipo === 'fiado') {
          debtBeforePayment += t.valor;
        } else {
          debtBeforePayment -= t.valor;
        }
      });

      const debtAfterPayment = debtBeforePayment - amount;

      // Check if debt is zero or overpaid, using a small epsilon for float precision
      if (debtAfterPayment <= 0.001) {
        // Debt is cleared, delete all history for this client
        clientHistoricoSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
      } else {
        // Debt is not cleared, add the payment to the history
        batch.set(doc(historicoRef), {
          tipo: 'pagamento',
          valor: amount,
          data: firestoreDate,
        });
      }
    }
  }

  await batch.commit();
}

export async function updateClienteName(clienteId: string, newName: string) {
  const batch = writeBatch(db);

  const clienteRef = doc(db, 'usuarios', clienteId);
  batch.update(clienteRef, { nome: newName });

  const pagamentosRef = collection(db, 'pagamentos');
  const q = query(pagamentosRef, where('clienteId', '==', clienteId));
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((doc) => {
    batch.update(doc.ref, { clienteNome: newName });
  });

  await batch.commit();
}


export async function getClientes(): Promise<Cliente[]> {
  const clientesRef = collection(db, 'usuarios');
  const q = query(clientesRef, orderBy('nome'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().nome as string }));
}

export async function getClientesWithDebts(): Promise<ClienteWithDebt[]> {
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

  const clientesRef = collection(db, 'usuarios');
  const clientesSnapshot = await getDocs(query(clientesRef, orderBy('nome')));

  const clientesWithDebts = clientesSnapshot.docs.map(doc => {
      const id = doc.id;
      return {
          id: id,
          name: doc.data().nome,
          debt: userDebts.get(id) || 0,
      };
  });

  return clientesWithDebts;
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
      date: data.data.toDate(),
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
  const userDetails = new Map<string, { debt: number, lastFiadoDate: Timestamp | null }>();

  const historicoQuery = query(collectionGroup(db, 'historico'));
  const historicoSnapshot = await getDocs(historicoQuery);

  historicoSnapshot.docs.forEach(doc => {
      const transaction = doc.data() as { tipo: string; valor: number; data: Timestamp };
      const userId = doc.ref.parent.parent!.id;
      const details = userDetails.get(userId) || { debt: 0, lastFiadoDate: null };

      if (transaction.tipo === 'fiado') {
          details.debt += transaction.valor;
          if (!details.lastFiadoDate || transaction.data.toMillis() > details.lastFiadoDate.toMillis()) {
              details.lastFiadoDate = transaction.data;
          }
      } else {
          details.debt -= transaction.valor;
      }
      userDetails.set(userId, details);
  });

  const debtorsData: Debtor[] = [];
  const userIdsWithDebt = Array.from(userDetails.keys()).filter(id => userDetails.get(id)!.debt > 0.001);

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
          const details = userDetails.get(doc.id)!;
          debtorsData.push({
              id: doc.id,
              name: doc.data().nome,
              debt: details.debt,
              lastFiadoDate: details.lastFiadoDate ? details.lastFiadoDate.toDate() : undefined,
          });
      });
  }
  
  return debtorsData.sort((a, b) => b.debt - a.debt);
}
