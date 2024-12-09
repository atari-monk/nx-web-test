export interface Message {
  sender: string;
  message: string;
  timestamp: Date;
}

export interface RoomMessages {
  [room: string]: Message[];
}
