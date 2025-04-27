export interface Worker {
  employee_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  worker_roles?: {
    roles: WorkerRole[];
  };
}

export interface WorkerRole {
  TBL_ROLE: {
    id: string;
    role_name: string;
  };
}

export interface Service {
  serviceKey: string;
  serviceName: string;
  servicePrice: number;
}

export interface LaundryService {
  laundryKey: string;
  laundryName: string;
  laundryLimit: number;
  weightUnit: string;
}
