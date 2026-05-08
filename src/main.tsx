import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// 🔴 নতুন ইম্পোর্ট
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 🔴 এন্টারপ্রাইজ লেভেল ক্যাশিং কনফিগারেশন
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // ৫ মিনিট পর্যন্ত ডেটা ফ্রেশ হিসেবে ক্যাশে থাকবে (কোনো API কল হবে না)
      refetchOnWindowFocus: false, // উইন্ডো ফোকাস করলে বারবার রিলোড হওয়া বন্ধ করবে
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)