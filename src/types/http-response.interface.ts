export interface HttpResponse<T> {
  statusCode: number;
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 