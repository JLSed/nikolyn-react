export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: any;
}

export interface AuditLog {
  employee_id: string;
  email: string;
  action_type: string;
  details: string;
  on_page: string;
}

export interface AuditLogWithActor extends AuditLog {
  log_id: string;
  timestamp: string;
}
