'use client';
import { ReactNode } from 'react';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Provider } from 'react-redux';
import { store } from '@/store';
import AuthProvider from './authProvider';
import ToastProvider from './toastProvider';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <Provider store={store}>
            <AuthProvider>
                <ThemeProvider>
                    <SidebarProvider>
                        {children}
                        <ToastProvider />
                    </SidebarProvider>
                </ThemeProvider>
            </AuthProvider>
        </Provider>
    );
}
