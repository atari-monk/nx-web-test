export interface Message {
  sender: string;
  message: string;
  timestamp: string;
}

export interface RoomMessages {
  [room: string]: Message[];
}
