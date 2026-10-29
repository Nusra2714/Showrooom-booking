
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Booking {
  id?: number;
  roomNumber: number;
  customerName: string;
  mobile: string;
  email: string;
  model: string;
  date: string;
  time: string;
  status?: string;
  createdAt?: string;
  releasedAt?: string | null;
}

export interface RoomStatus {
  roomNumber: number;
  status: 'AVAILABLE' | 'BUSY';
  booking: Booking | null;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly apiUrl = 'https://showroom-booking-backend.onrender.com/api';

  constructor(private http: HttpClient) {}

  getRooms(): Observable<RoomStatus[]> {
    return this.http.get<RoomStatus[]>(`${this.apiUrl}/rooms`);
  }

  createBooking(booking: Omit<Booking, 'id' | 'status' | 'createdAt' | 'releasedAt'>): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiUrl}/bookings`, booking);
  }

  releaseRoom(roomNumber: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/rooms/${roomNumber}/booking`
    );
  }

  getBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/bookings`);
  }
}
