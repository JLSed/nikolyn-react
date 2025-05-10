export interface Worker {
  employee_id: string;
  created_at: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  auth_id: string;
  email: string;
  status: string;
  contact_number: string | null;
  address: string | null;
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

export interface CreateWorkerRequest {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  contact_number: string | null;
  address: string | null;
  password: string;
  role_ids: string[];
}
