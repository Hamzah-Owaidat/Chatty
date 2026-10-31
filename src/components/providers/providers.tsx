'use client';
import { ReactNode } from 'react';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { PreferencesProvider } from '@/context/PreferencesContext';
import { Provider } from 'react-redux';
import { store } from '@/store';
import AuthProvider from './authProvider';
import ToastProvider from './toastProvider';
import RouteGuard from './RouteGuard';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <Provider store={store}>
            <AuthProvider>
                <RouteGuard>
                    <ThemeProvider>
                        <PreferencesProvider>
                            <SidebarProvider>
                                {children}
                                <ToastProvider />
                            </SidebarProvider>
                        </PreferencesProvider>
                    </ThemeProvider>
                </RouteGuard>
            </AuthProvider>
        </Provider>
    );
}

