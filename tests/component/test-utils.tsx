import React from "react";
import { render, type RenderResult } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { Toaster } from "react-hot-toast";
import authReducer from "@/store/slices/authSlice";
import { ThemeProvider } from "@/context/ThemeContext";
import type { AuthState } from "@/types/auth/auth.state";

export function createTestStore(auth?: Partial<AuthState>) {
  const initialAuth: AuthState = {
    user: null,
    token: null,
    status: "idle",
    error: null,
    initialized: true,
    ...auth,
  };
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: initialAuth },
  });
}

/** Renders with a fresh Redux store and a toast host, so user-facing toasts can be asserted. */
export function renderWithProviders(
  ui: React.ReactElement,
  options: { auth?: Partial<AuthState> } = {},
): RenderResult & { store: ReturnType<typeof createTestStore> } {
  const store = createTestStore(options.auth);
  const result = render(
    <Provider store={store}>
      <ThemeProvider>
        {ui}
        <Toaster />
      </ThemeProvider>
    </Provider>,
  );
  return Object.assign(result, { store });
}
