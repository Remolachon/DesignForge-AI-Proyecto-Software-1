export interface CompanyAdmin {
  id: number;
  nit: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string;
  start_date: string;
  status: string;
  is_active: boolean;
  created_by_user_id: number;
  created_by_user_name: string | null;
}
