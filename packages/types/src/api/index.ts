export interface ApiResponse<T> {
  // Essential for Every Response
  success: boolean;
  message: string;

  // response status codes
  statusCode: number;

  // Essential for success type 'true'
  data?: T;

  // for pagination and other data
  meta?: undefined | ResponseMeta;

  // Optional for success type 'false'
  errors?: undefined | Record<string, string[] | undefined | string>;
}

export type ResponseMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};
