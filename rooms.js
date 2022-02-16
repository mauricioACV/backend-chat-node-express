const rooms = ['arcade', 'webdesign', 'coding'];

const addRoom = ({ room }) => {
  room = room.trim().toLowerCase();
  const existingRoom = rooms.includes(room);
  if (existingRoom) return { error: "La sala ya existe" };
  rooms.push(room);
  console.log(rooms);
  return { rooms };
};

const removeRoom = (id) => {
  const index = rooms.findIndex((room) => room.id === id);
  if (index !== -1) return rooms.splice(index, 1)[0];
};

const getRooms = () => rooms;

module.exports = { addRoom, removeRoom, getRooms };