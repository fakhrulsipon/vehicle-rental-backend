export interface IStaff {
  id?: number;
  email: string;
  password_hash: string;
  name: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IVehicle {
  id?: number;
  name: string;
  plate_number: string;
  category: string;
  daily_rate: number;
  photo_path?: string | null;
  deleted_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IRental {
  id?: number;
  vehicle_id: number;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status?: 'booked' | 'ongoing' | 'completed' | 'cancelled';
  created_at?: Date;
  updated_at?: Date;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
}

export interface IVehicleFilters extends IPaginationOptions {
  category?: string;
  search?: string;
}

export interface IRentalFilters extends IPaginationOptions {
  vehicle_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
}
