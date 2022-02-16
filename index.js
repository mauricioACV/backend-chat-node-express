const { addUser, removeUser, getUser, getUsers, getUsersInRoom } = require('./users');
const { addRoom, removeRoom, getRooms } = require('./rooms');

const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');


const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(router);

io.on("connection", (socket) => {
  console.log("new connection!!");

  socket.on("newRoom", ({room}) => {
    const { error, rooms } = addRoom({ room });
    if (error) return;
    socket.broadcast.emit("roomsList", {
      rooms
    });
  });

  socket.on("getUsers", () => {
    const users = getUsers();
    socket.emit("usersList", {
      users
    });
  });

  socket.on("getRooms", () => {
    const rooms = getRooms();
    console.log(rooms)
    socket.emit("roomsList", {
      rooms
    });
  });

  socket.on("join", ({ name, room, avatar }, callback) => {
    const userObj = { id: socket.id, name, room, avatar };
    const { error, user } = addUser(userObj);
    if (error) return callback(error);
    //mensaje para el usuario
    socket.emit("message", {
      user: "admin",
      text: `${user.name}, bienvenid@ a room ${user.room}`,
    });
    //mensaje para todos los usuarios del canal, meons para el usario que se unió al canal
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name}, se ha unido al chat!` });
    socket.join(user.room);

    //pasando usuarios conectados a una room, para manejar en front
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    //callback del front sin pasar error, porque no hay errores en este punto. en el front esto sin error no genera nada.
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    console.log(message);
    const user = getUser(socket.id);
    io.to(user.room).emit("message", { user: user.name, text: message });
    //en caso de requerir hacer algo despues de enviar el mensaje el front
    callback();
  });

  socket.on("disconnect", () => {
    console.log("user disconnect!!");
    const user = removeUser(socket.id);
    if(user) {
      io.to(user.room).emit('message', {user:'admin', text: `${user.name} se ha desconectado...`});
      //actualiza el estado de usuarios conectados en el room
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(process.env.PORT || 5000, () => console.log(`Server has started.`));