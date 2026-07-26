export interface EdgeFunctionRequest {
  operation: string;
  project_id?: string;
  user_id?: string;
  data?: Record<string, unknown>;
}
