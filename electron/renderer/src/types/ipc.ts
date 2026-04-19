export type SuccessResponse<T> = { success: true; data: T }
export type ErrorResponse = { success: false; error: string }
export type IPCResponse<T> = SuccessResponse<T> | ErrorResponse
