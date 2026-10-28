import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

type RoomStatus = 'Available' | 'Busy';

interface Booking {
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
  booking: Booking | null;
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

    if (!this.customerName.trim() || !this.mobile.trim() ||
        !this.email.trim() || !this.bookingDate ||
        !this.bookingTime || !this.selectedModel || !this.selectedRoom) {
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
      this.showNotice('That room is busy. Please select an available room.', 'error');
      this.selectedRoom = '';
      return;
    }

    const booking: Booking = {
      customerName: this.customerName.trim(),
      mobile: this.mobile.trim(),
      email: this.email.trim(),
      date: this.bookingDate,
      time: this.bookingTime,
      model: this.selectedModel,
      room: this.selectedRoom,
      bookedAt: new Date().toISOString()
    };

    room.status = 'Busy';
    room.booking = booking;
    this.saveRooms();
    this.showNotice(`${room.name} booked successfully for ${booking.customerName}.`, 'success');
    this.resetCustomerForm();
  }

  releaseRoom(room: Room): void {
    if (room.status !== 'Busy') return;

    room.status = 'Available';
    room.booking = null;
    this.saveRooms();
    this.showNotice(`${room.name} has been released and is now available.`, 'success');
    if (!this.selectedRoom) this.selectedRoom = room.name;
  }

  selectRoom(room: Room): void {
    if (room.status === 'Available') this.selectedRoom = room.name;
  }

  trackByRoom(_index: number, room: Room): string {
    return room.name;
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
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  private makeEmptyRooms(): Room[] {
    return ['Room 1', 'Room 2', 'Room 3', 'Room 4'].map(name => ({
      name,
      status: 'Available' as RoomStatus,
      booking: null
    }));
  }

  private loadRooms(): void {
    try {
      const saved = localStorage.getItem('pixcom-showroom-rooms');
      if (!saved) return;

      const parsed = JSON.parse(saved) as Room[];
      const expectedNames = ['Room 1', 'Room 2', 'Room 3', 'Room 4'];
      if (Array.isArray(parsed) && expectedNames.every(name => parsed.some(r => r.name === name))) {
        this.rooms = expectedNames.map(name => {
          const savedRoom = parsed.find(r => r.name === name)!;
          return {
            name,
            status: savedRoom.status === 'Busy' && savedRoom.booking ? 'Busy' : 'Available',
            booking: savedRoom.status === 'Busy' && savedRoom.booking ? savedRoom.booking : null
          };
        });
      }
    } catch {
      this.rooms = this.makeEmptyRooms();
    }
  }

  private saveRooms(): void {
    localStorage.setItem('pixcom-showroom-rooms', JSON.stringify(this.rooms));
  }
}
