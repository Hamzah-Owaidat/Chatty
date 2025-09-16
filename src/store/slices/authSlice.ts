import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { setAuthToken, getSavedToken } from "@/utils/authToken";
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  getCurrentUser,
} from "@/lib/api/auth";
import { LoginCredentials, RegisterData, LoginResponse, RegisterResponse } from "@/types/auth/auth.models";
import { AuthState } from "@/types/auth/auth.state";
import { User } from "@/types/user";
import { getErrorMessage } from "@/utils/error";

// Initialize auth on app start
export const initializeAuth = createAsyncThunk<
  { user: User | null; token: string | null },
  void,
  { rejectValue: string }
>("auth/initialize", async (_, thunkAPI) => {
  const token = getSavedToken();
  if (!token) return { user: null, token: null };

  try {
    setAuthToken(token);
    const response = await getCurrentUser();
    return { user: response.data, token };
  } catch (err) {
    setAuthToken(null);
    const message = getErrorMessage(err);
    return thunkAPI.rejectWithValue(message);
  }
});

// Login user
export const loginUser = createAsyncThunk<
  { user: User; token: string },
  LoginCredentials,
  { rejectValue: string }
>("auth/login", async (credentials, thunkAPI) => {
  try {
    const res: LoginResponse = await loginApi(credentials);

    if (!res.isSuccess || !res.data)
      return thunkAPI.rejectWithValue(res.error || "Login failed");

    const token = res.data; // ✅ res.data is the token string
    setAuthToken(token);

    // Fetch the user after setting the token
    const userRes = await getCurrentUser(); 
    if (!userRes.data) return thunkAPI.rejectWithValue("Failed to fetch user");

    return { user: userRes.data, token };
  } catch (err) {
    return thunkAPI.rejectWithValue(getErrorMessage(err));
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

    if (!res.isSuccess) return thunkAPI.rejectWithValue(res.error || "Registration failed");

    const token = res.data ?? "";
    setAuthToken(token);

    try {
      const userResponse = await getCurrentUser();
      return { user: userResponse.data, token };
    } catch {
      return { user: undefined, token };
    }
  } catch (err) {
    const message = getErrorMessage(err);
    return thunkAPI.rejectWithValue(message);
  }
});

// Fetch current user
export const fetchCurrentUser = createAsyncThunk<
  { user: User },
  void,
  { rejectValue: string }
>("auth/me", async (_, thunkAPI) => {
  try {
    const res = await getCurrentUser();
    return { user: res.data };
  } catch (err) {
    setAuthToken(null);
    const message = getErrorMessage(err);
    return thunkAPI.rejectWithValue(message);
  }
});

// Logout
export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await logoutApi();
  } finally {
    setAuthToken(null);
  }
});

const initialState: AuthState = {
  user: null,
  token: getSavedToken(),
  status: "idle",
  error: null,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user?: User; token?: string }>) {
      if (action.payload.token) {
        state.token = action.payload.token;
        setAuthToken(action.payload.token);
      }
      if (action.payload.user) state.user = action.payload.user;
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
      // Initialize
      .addCase(initializeAuth.pending, (state) => { state.status = "loading"; state.error = null; })
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
      .addCase(loginUser.pending, (state) => { state.status = "loading"; state.error = null; })
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
      .addCase(registerUser.pending, (state) => { state.status = "loading"; state.error = null; })
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
      .addCase(fetchCurrentUser.pending, (state) => { state.status = "loading"; })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = "failed";
        state.user = null;
        state.token = null;
        state.error = action.payload ?? "Failed to fetch user";
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
