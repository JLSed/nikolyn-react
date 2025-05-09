export interface Worker {
  employee_id: string;
  created_at: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  auth_id: string;
  email: string;
}

export interface WorkerRole {
  role_id: string;
  role_name: string;
  link: string;
  icon: string;
  access_page: string;
}

export interface WorkerWithRoles {
  worker: Worker;
  worker_roles: WorkerRole[];
}
