interface ApiErrorResponse {
  isSuccess: boolean;
  error?: string;
  message?: string;
}

interface AxiosErrorLike {
  response?: {
    data?: ApiErrorResponse;
  };
  message?: string;
  error?: string;
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  
  if (error && typeof error === "object") {
    const e = error as AxiosErrorLike & ApiErrorResponse;
    
    // Check for your API response structure first (when thrown from API functions)
    if (e.error) return e.error;
    if (e.message) return e.message;
    
    // Check for axios error structure (for other cases)
    if (e.response?.data?.error) return e.response.data.error;
    if (e.response?.data?.message) return e.response.data.message;
  }
  
  return "An unexpected error occurred";
}