import { getUsersInRoom } from "./users.js";

const rooms = ['arcade', 'webdesign', 'coding'];
const defaultRooms = ['arcade', 'webdesign', 'coding'];

export const addRoom = ({ room }) => {
  room = room.trim().toLowerCase();
  const existingRoom = rooms.includes(room);
  if (existingRoom) return { error: "La sala ya existe" };
  rooms.push(room);
  return { rooms };
};

export const removeRoom = (userRoom) => {
  const userInRoom = getUsersInRoom(userRoom);
  const isDefaultRoom = defaultRooms.includes(userRoom);
  if(userInRoom.length > 0 || isDefaultRoom) return null;
  const index = rooms.findIndex((room) => room === userRoom);
  if (index !== -1) return rooms.splice(index, 1)[0];
};

export const getRooms = () => rooms;