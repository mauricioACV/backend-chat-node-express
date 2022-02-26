import { createServer } from "http";
import { Server } from "socket.io";
import { addUser, removeUser, getUser, getUsers, getUsersInRoom } from "./users.js";
import { addRoom, getRooms, removeRoom } from "./rooms.js";
import cors from 'cors';
import express from 'express';
import { router } from "./router.js";


const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(router);

const PORT = process.env.PORT || 5000;

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

  socket.on("updateUsersList", () => {
    const users = getUsers();
    socket.broadcast.emit("usersList", {
      users
    });
  });

  socket.on("getRooms", () => {
    const rooms = getRooms();
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
    const user = getUser(socket.id);
    io.to(user.room).emit("message", { user: user.name, text: message });
    //en caso de requerir hacer algo despues de enviar el mensaje el front
    callback();
  });

  socket.on("disconnect", () => {
    console.log("user disconnect!!");
    const user = removeUser(socket.id);
    if(user) {
      const room = removeRoom(user.room);
      io.to(user.room).emit('message', {user:'admin', text: `${user.name} se ha desconectado...`});
      //actualiza el estado de usuarios conectados en el room
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
      //Actualiza lista de usuarios
      socket.broadcast.emit("usersList", {
        users : getUsers()
      });
    }
  });
});


httpServer.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});