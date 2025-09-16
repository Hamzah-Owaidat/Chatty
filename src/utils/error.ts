// utils/error.ts
interface AxiosErrorLike {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

export function getErrorMessage(error: unknown): string {
  // If it's already a string, just return it
  if (typeof error === "string") return error;

  // If it's an object, check for known properties
  if (error && typeof error === "object") {
    const e = error as AxiosErrorLike;

    if (e.message) return e.message;
    if (e.response?.data?.error) return e.response.data.error;
    if (e.response?.data?.message) return e.response.data.message;
  }

  return "An unexpected error occurred";
}
