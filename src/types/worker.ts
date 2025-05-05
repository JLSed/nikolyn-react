export interface Worker {
  employee_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
}

export interface WorkerRole {
  TBL_ROLE: {
    role_id: string;
    role_name: string;
    link: string;
    icon: string;
  };
}

export interface WorkerWithRoles {
  worker: Worker;
  worker_roles: WorkerRole[];
}
