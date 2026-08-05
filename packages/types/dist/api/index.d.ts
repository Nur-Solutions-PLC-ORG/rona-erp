export interface ApiResponse<T> {
    success: boolean;
    message: string;
    statusCode: number;
    data?: T;
    meta?: undefined | ResponseMeta;
    errors?: undefined | Record<string, string[] | undefined | string>;
}
export type ResponseMeta = {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
};
