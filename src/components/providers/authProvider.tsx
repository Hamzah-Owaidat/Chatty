"use client";
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { initializeAuth } from '@/store/slices/authSlice';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  const { status, initialized, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Initialize authentication when the app starts
    if (!initialized) {
      console.log('Initializing auth...');
      dispatch(initializeAuth());
    }
  }, [dispatch, initialized]);


  // Optional: Show error if initialization failed
  if (error && status === 'failed') {
    console.warn('Auth initialization failed:', error);
    // You can choose to show an error or just continue
  }

  return <>{children}</>;
}