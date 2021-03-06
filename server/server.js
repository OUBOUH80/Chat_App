const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyPaser = require('body-parser');
const app = express();
const fs = require('fs');
const router1 = express.Router();
const ItemMessage = require('./models/message');
app.use(bodyPaser.json());

//enable cors
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept");
    res.header("Access-Control-Allow-Methods", 'PUT,POST,GET,DELETE');

    next();
});

// Data base connection
const db = require('./config/keys').mongoURI;

mongoose
    .connect(db)
    .then(() => console.log("mongoDB Connected ..."))
    .catch(err => console.log(err));


const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const router = require('./router');


const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(router);

io.on('connect', (socket) => {
    socket.on('join', ({ Name, Room }, callback) => {
        const { error, user } = addUser({ id: socket.id, Name, Room });
        console.log(Name,Room);
        if (error) return callback(error);

        socket.join(user.Room);

       /* socket.emit('message', { user: 'admin', text: `${user.Name}, welcome to room ${user.Room}.` });
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.Name} has joined!` });*/

        io.to(user.room).emit('roomData', { room: user.Room, users: getUsersInRoom(user.Room) });

        callback();
    });

    ///Send message

    socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);       

        io.to(user.Room).emit('message', { user: user.Name,type:"text", text: message });

        callback();
    });

    ///Send image
    socket.on('image', async image => {
        let newDate = new Date()
        let date = newDate.getDate();
        let month = newDate.getMonth() + 1;
        let year = newDate.getFullYear();
        let time = newDate.toLocaleString("en-US", { hour: "numeric", minute: "numeric" });
        const formattedTime=`${date}${"/"}${month<10?`0${month}`:`${month}`}${"/"}${year}${" "}${"at"}${" "}${time}`;

        const user = getUser(socket.id);
        const buffer = Buffer.from(image, 'base64');
        await fs.writeFile('uploads/file.txt', buffer,function (err) {
            if (err) return console.log(err);}); // fs.promises
            io.to(user.Room).emit('image', [user.Name,buffer.toString('base64')]); // image should be a buffer
            //////////send it to db
          
                ItemMessage.collection.insert({
                    Room: user.Room,
                    me: 
            
                        {
                            name:user.Name,
                            type:"image",
                            message1:buffer.toString('base64'),
                            date:formattedTime
                        }
                })     
    });
    
    /////////////////////////////////////////////////

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
        }
    })
});

server.listen(process.env.PORT || 5000, () => console.log(`Server has started on `));