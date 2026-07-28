export interface ApiResponse<T> {
  // Essential for Every Response
  success: boolean;
  message: string;

  // Essential for success type 'true'
  data?: T;

  // Optional for success type 'false'
  errors?: Record<string, string[] | undefined | string>;
}
