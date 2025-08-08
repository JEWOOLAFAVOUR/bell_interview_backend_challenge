import { Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface IUser {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: "user" | "admin";
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ErrorResponse {
  success: boolean;
  error: boolean;
  message: string;
}

// Update CustomRequest to handle the user object properly
export interface CustomRequest extends Request {
  user?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    role: "user" | "admin";
    avatar?: string;
    isAdmin: boolean;
  };
  userId?: string;
}

// Add interfaces for the booking challenge
export interface IProperty {
  id: number;
  title: string;
  description: string;
  price_per_night: number;
  available_from: Date;
  available_to: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBooking {
  id: number;
  property_id: number;
  user_id: number;
  user_name: string;
  start_date: Date;
  end_date: Date;
  total_price?: number;
  status: "confirmed" | "cancelled"; // Removed 'pending' - bookings are immediately confirmed
  created_at: Date;
  updatedAt?: Date;
}

// Additional interfaces for API responses
export interface PropertyWithAvailability extends IProperty {
  available_dates: Array<{
    start_date: string;
    end_date: string;
  }>;
}

export interface AvailableProperty extends IProperty {
  is_fully_available: boolean;
  available_periods: Array<{
    start_date: string;
    end_date: string;
    days_available: number;
  }>;
  total_available_days: number;
}

export interface BookingRequest {
  property_id: number;
  start_date: string;
  end_date: string;
}
