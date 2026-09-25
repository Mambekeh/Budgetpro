// utils/businessSetup.js
import { db } from '../firebase/config';

export const createBusinessProfile = async (userId, businessData) => {
  const { collection, setDoc, doc, serverTimestamp } = await import('firebase/firestore');
  
  try {
    const businessRef = doc(collection(db, 'users', userId, 'businessInfo'));
    await setDoc(businessRef, {
      ...businessData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error creating business profile:', error);
    return false;
  }
};

export const getBusinessTransactions = async (userId, month, year) => {
  const { collection, query, where, getDocs } = await import('firebase/firestore');
  
  try {
    const transactionsRef = collection(db, 'users', userId, 'businessTransactions');
    const q = query(
      transactionsRef,
      where('month', '==', month),
      where('year', '==', year)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};