
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookingService, Booking as ApiBooking } from './services/booking.service';

type RoomStatus = 'Available' | 'Busy';

interface RoomBooking {
  customerName: string;
  mobile: string;
  email: string;
  date: string;
  time: string;
  model: string;
  room: string;
  bookedAt: string;
}

interface Room {
  name: string;
  status: RoomStatus;
  booking: RoomBooking | null;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  customerName = '';
  mobile = '';
  email = '';
  bookingDate = this.getToday();
  bookingTime = '10:00';
  selectedModel = '';
  selectedRoom = '';

  readonly models = [
    'Optiq',
    'Lyriq',
    'Vistiq',
    'Escalade IQ',
    'Escalade IQL',
    'Escalade'
  ];

  rooms: Room[] = this.makeEmptyRooms();
  notice = '';
  noticeType: 'success' | 'error' = 'success';
  loadingRooms = false;
  submitting = false;
  releasingRoomNumber: number | null = null;

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.loadRooms();
  }

  get availableRooms(): Room[] {
    return this.rooms.filter(room => room.status === 'Available');
  }

  get busyCount(): number {
    return this.rooms.filter(room => room.status === 'Busy').length;
  }

  bookRoom(): void {
    this.notice = '';

    if (
      !this.customerName.trim() ||
      !this.mobile.trim() ||
      !this.email.trim() ||
      !this.bookingDate ||
      !this.bookingTime ||
      !this.selectedModel ||
      !this.selectedRoom
    ) {
      this.showNotice('Please complete all fields before booking.', 'error');
      return;
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(this.mobile.trim())) {
      this.showNotice('Please enter a valid mobile number.', 'error');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.showNotice('Please enter a valid email address.', 'error');
      return;
    }

    const room = this.rooms.find(item => item.name === this.selectedRoom);

    if (!room || room.status === 'Busy') {
      this.showNotice(
        'That room is busy. Please refresh room availability and select another room.',
        'error'
      );
      this.loadRooms();
      return;
    }

    const roomNumber = Number(room.name.replace('Room ', ''));

    this.submitting = true;

    this.bookingService.createBooking({
      roomNumber,
      customerName: this.customerName.trim(),
      mobile: this.mobile.trim(),
      email: this.email.trim(),
      model: this.selectedModel,
      date: this.bookingDate,
      time: this.bookingTime
    }).subscribe({
      next: (booking: ApiBooking) => {
        this.submitting = false;
        this.showNotice(
          `${room.name} booked successfully for ${booking.customerName}.`,
          'success'
        );
        this.resetCustomerForm();
        this.loadRooms();
      },
      error: (error) => {
        this.submitting = false;

        if (error.status === 409) {
          this.showNotice(
            'This room has already been booked. Refreshing room availability.',
            'error'
          );
        } else {
          this.showNotice(
            'Could not save the booking. Check that the backend is running and try again.',
            'error'
          );
        }

        this.loadRooms();
      }
    });
  }

  releaseRoom(room: Room): void {
    if (room.status !== 'Busy') return;

    const roomNumber = Number(room.name.replace('Room ', ''));
    this.notice = '';
    this.releasingRoomNumber = roomNumber;

    this.bookingService.releaseRoom(roomNumber).subscribe({
      next: () => {
        this.releasingRoomNumber = null;
        this.showNotice(
          `${room.name} has been released and is now available.`,
          'success'
        );

        if (this.selectedRoom === room.name) {
          this.selectedRoom = '';
        }

        this.loadRooms();
      },
      error: (error) => {
        this.releasingRoomNumber = null;

        this.showNotice(
          error.status === 404
            ? 'This room is already available. Refreshing room availability.'
            : 'Could not release the room. Please check the backend and try again.',
          'error'
        );

        this.loadRooms();
      }
    });
  }

  selectRoom(room: Room): void {
    if (room.status === 'Available') {
      this.selectedRoom = room.name;
    }
  }

  trackByRoom(_index: number, room: Room): string {
    return room.name;
  }

  private loadRooms(): void {
    this.loadingRooms = true;

    this.bookingService.getRooms().subscribe({
      next: (apiRooms) => {
        this.rooms = apiRooms.map(apiRoom => ({
          name: `Room ${apiRoom.roomNumber}`,
          status: apiRoom.status === 'BUSY' ? 'Busy' : 'Available',
          booking: apiRoom.booking
            ? {
                customerName: apiRoom.booking.customerName,
                mobile: apiRoom.booking.mobile,
                email: apiRoom.booking.email,
                date: apiRoom.booking.date,
                time: apiRoom.booking.time,
                model: apiRoom.booking.model,
                room: `Room ${apiRoom.roomNumber}`,
                bookedAt: apiRoom.booking.createdAt ?? ''
              }
            : null
        }));

        if (
          this.selectedRoom &&
          !this.rooms.some(
            room => room.name === this.selectedRoom && room.status === 'Available'
          )
        ) {
          this.selectedRoom = '';
        }

        this.loadingRooms = false;
      },
      error: () => {
        this.loadingRooms = false;
        this.showNotice(
          'Could not load room availability. Make sure the backend is running.',
          'error'
        );
      }
    });
  }

  private resetCustomerForm(): void {
    this.customerName = '';
    this.mobile = '';
    this.email = '';
    this.selectedModel = '';
    this.selectedRoom = '';
  }

  private showNotice(message: string, type: 'success' | 'error'): void {
    this.notice = message;
    this.noticeType = type;
  }

  private getToday(): string {
    const now = new Date();
    const local = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    );
    return local.toISOString().slice(0, 10);
  }

  private makeEmptyRooms(): Room[] {
    return ['Room 1', 'Room 2', 'Room 3', 'Room 4'].map(name => ({
      name,
      status: 'Available' as RoomStatus,
      booking: null
    }));
  }
}
