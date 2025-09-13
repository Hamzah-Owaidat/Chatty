import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { setAuthToken, getSavedToken } from "@/utils/authToken";
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  getCurrentUser,
} from "@/lib/api/auth"; 
import {
  LoginCredentials,
  RegisterData,
  LoginResponse,
  RegisterResponse,
} from "@/types/auth/auth.models";
import { AuthState } from "@/types/auth/auth.state";
import { User } from "@/types/user";

// Initialize auth on app start
export const initializeAuth = createAsyncThunk<
  { user: User; token: string } | { user: null; token: null },
  void,
  { rejectValue: string }
>("auth/initialize", async (_, thunkAPI) => {
  const token = getSavedToken();
  
  if (!token) {
    return { user: null, token: null };
  }

  try {
    // Set token for API request
    setAuthToken(token);
    
    // Fetch current user data
    const response = await getCurrentUser();
    
    console.log("User data fetched:", response);
    
    return { user: response, token };
  } catch (error: any) {
    console.error("Failed to fetch user data:", error);
    
    // If token is invalid, clear it
    setAuthToken(null);
    
    return thunkAPI.rejectWithValue(
      error?.response?.data?.message || error?.message || "Failed to authenticate"
    );
  }
});

// Login user
export const loginUser = createAsyncThunk<
  { user?: User; token: string },
  LoginCredentials,
  { rejectValue: string }
>("auth/login", async (credentials, thunkAPI) => {
  try {
    const res: LoginResponse = await loginApi(credentials);
    if (!res.success) {
      return thunkAPI.rejectWithValue(res.errors?.[0] || "Login failed");
    }
    const token = res.token;
    setAuthToken(token);
    
    // After login, fetch current user data
    try {
      const userResponse = await getCurrentUser();
      return { user: userResponse, token };
    } catch {
      // If fetching user fails, still return the token
      return { user: undefined, token };
    }
  } catch (err: any) {
    const message =
      err?.response?.data?.errors?.[0] ?? err?.message ?? "Login failed";
    return thunkAPI.rejectWithValue(message);
  }
});

// Register user
export const registerUser = createAsyncThunk<
  { user?: User; token: string },
  RegisterData,
  { rejectValue: string }
>("auth/register", async (data, thunkAPI) => {
  try {
    const res: RegisterResponse = await registerApi(data);
    if (!res.success) {
      return thunkAPI.rejectWithValue(res.errors?.[0] || "Registration failed");
    }
    const token = res.token;
    setAuthToken(token);
    
    // After registration, fetch current user data
    try {
      const userResponse = await getCurrentUser();
      return { user: userResponse, token };
    } catch {
      // If fetching user fails, still return the token
      return { user: undefined, token };
    }
  } catch (err: any) {
    const message =
      err?.response?.data?.errors?.[0] ?? err?.message ?? "Registration failed";
    return thunkAPI.rejectWithValue(message);
  }
});

// Fetch current user (can be called independently)
export const fetchCurrentUser = createAsyncThunk<
  { user: User },
  void,
  { rejectValue: string }
>("auth/me", async (_, thunkAPI) => {
  try {
    const res = await getCurrentUser();
    console.log("heloooooooooo");
    console.log("Fetched user:", res.user);
    return { user: res };
  } catch (err: any) {
    console.error("Fetch user error:", err);
    // If fetching current user fails, clear the invalid token
    setAuthToken(null);
    return thunkAPI.rejectWithValue(err?.message ?? "Failed to load user");
  }
});

// Logout
export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await logoutApi();
  } catch {
    // ignore API error
  } finally {
    setAuthToken(null);
  }
});

const initialState: AuthState = {
  user: null,
  token: getSavedToken(),
  status: "idle",
  error: null,
  initialized: false, // Add this to track if auth has been initialized
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user?: User; token?: string }>
    ) {
      if (action.payload.token) {
        state.token = action.payload.token;
        setAuthToken(action.payload.token);
      }
      if (action.payload.user) {
        state.user = action.payload.user;
      }
    },
    clearAuth(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      setAuthToken(null);
    },
  },
  extraReducers(builder) {
    builder
      // Initialize auth
      .addCase(initializeAuth.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.initialized = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.status = "failed";
        state.initialized = true;
        state.user = null;
        state.token = null;
        state.error = action.payload || "Initialization failed";
      })
      
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user ?? null;
        state.token = action.payload.token;
        state.initialized = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Login failed";
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user ?? null;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Registration failed";
      })
      
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = "failed";
        state.user = null;
        state.token = null;
        state.error = action.payload || "Failed to fetch user";
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.status = "idle";
        state.error = null;
        state.initialized = false;
      });
  },
});

export const { setCredentials, clearAuth } = authSlice.actions;
export default authSlice.reducer;