// src/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { Query } from 'appwrite';
import { databases, DATABASE_ID, PRODUCT_COLLECTION_ID } from '../appwrite';

// ১. সব প্রোডাক্ট বা ক্যাটাগরি অনুযায়ী প্রোডাক্ট আনার হুক
export const useProducts = (categoryId?: string | null) => {
  return useQuery({
    queryKey: ['products', categoryId], // এই key দিয়ে সে ক্যাশ চিনে রাখবে
    queryFn: async () => {
      const queries = categoryId ? [Query.equal('categories', categoryId)] : [];
      const res = await databases.listDocuments(DATABASE_ID, PRODUCT_COLLECTION_ID, queries);
      return res.documents.reverse();
    }
  });
};

// ২. সিঙ্গেল প্রোডাক্ট ডিটেইলস আনার হুক
export const useProductDetails = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await databases.getDocument(DATABASE_ID, PRODUCT_COLLECTION_ID, id);
      return res;
    },
    enabled: !!id, // আইডি না থাকলে কল হবে না
  });
};