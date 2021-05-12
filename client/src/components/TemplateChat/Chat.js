import React, { useState, useEffect,useLayoutEffect,useRef } from "react";
import queryString from 'query-string';
import io from "socket.io-client";
import ReactEmoji from 'react-emoji';
import { Link } from 'react-router-dom';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import './Chat.css';


const ENDPOINT = 'localhost:5000';

let socket;


function Chat({ location }) {

	const [name, setName] = useState('');
	const [room, setRoom] = useState('');
	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState([]);
	const [messagesDB, setMessagesDB] = useState([]);
	const [friends, setFriends] = useState([]);
	const [postId, setPostId] = useState(null);
	const [firstClick, setFirstClick] = useState(true);
	const [displayAside, setDisplayAside] = useState({display:'block'});
	const [displayMain, setDisplayMain] = useState({ display: 'none' });
	const [selectedFile,setSelectedFile]=useState(null);
	const [open, setOpen] = useState(false);
	const [file,setFile]=useState('');
	const time = new Date();
	const formattedTime = time.toLocaleString("en-US", { hour: "numeric", minute: "numeric" });

	useEffect(() => {
		
			//Fetch Friends
			fetch(`http://localhost:5000/friends/${nom}`)
				.then(res => res.json())
				.then(friend => setFriends(friend[0].Friends , console.log(`Friends feched ...`, JSON.stringify(friend[0].Friends ))));
		//console.log(` l message ${messagesDB[[0]]['me'].message1}`);
		
	}, []);


	//Send name and rooom to the server
	//get name of the user how will send the message
	const data = queryString.parse(window.location.search);
	const nom = data.name;




	const clickFreind = (event) => {
		
		//Connenct to the server
		socket = io(ENDPOINT);
		console.log(` list freinds ${JSON.stringify(friends[0].namef)}`);
		console.log(`room ${event.currentTarget.dataset.id}`);
		
	
		setDisplayAside({
			display: 'none'
		});

		setDisplayMain({
			display: 'block'
		})

		setFirstClick(false);

		setMessages([]);
    
		// Get the room == The person who will receive the message
		const { Name, Room } = { Name: nom, Room: event.currentTarget.dataset.id }
		setName(nom);
		setRoom(event.currentTarget.dataset.id);
		socket.emit('join', { Name, Room }, (error) => {
			if (error) {
				alert(error);
			}

			console.log(socket);
			
		});


		//Fetch Messages DB
		fetch(`http://localhost:5000/messages/${event.currentTarget.dataset.id}`)
			.then(res => res.json())
			.then(message => 	setMessagesDB(message)	);
	
	

	
		//Get messages reel time
		socket.on('message', message => {
			setMessages(messages => [...messages, [message]]);
			console.log(message)
			
		});
		
		socket.on('image', image => {
			// create image with
			const img = new Image();
			// change image type to whatever you use, or detect it in the backend 
			// and send it if you support multiple extensions
			const name = image[0];
			img.src = `data:image/jpg;base64,${image[1]}`; 
			setMessages(files => [...files, [name,img.src] ]);
			// Insert it into the DOM
		
		});
	
		
	}

	//Sending messages
	const sendMessage = (event) => {
		event.preventDefault();
		//Socket
		if (message) {
			socket.emit('sendMessage', message, () => setMessage(''));

			//send msg to the Database
			const requestOptions = {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					"Room":room,
					"user": name,
					"type":"text",
					"message1": message,
					"date": formattedTime
				})
			};
			fetch(`http://localhost:5000/insert/messages/sender`, requestOptions)
				.then(response => response.json())
				.then(data => setPostId(data.id));
		}
		
		
	}

///////////////Sending images//////////////
const onFileChange=e=>{
	setOpen(true) ;
	var data = setSelectedFile( e.target.files[0]);

}
  const confirm=()=>{
	setOpen(false);
	const reader = new FileReader();
	reader.onload = function() {
	  const base64 = reader.result.replace(/.*base64,/, '');
	  socket.emit('image',base64);
	};
	reader.readAsDataURL(selectedFile);
  }


  const cancel=()=>{
	setOpen(false);
  }

	

	return (
		<div id="container">
			<div className="container2">
				<aside >
					<header>
						<input type="text" placeholder="search"></input>
					</header>
					<ul >
						{friends.map((friend, i) =>
							<li
							key={i}
								data-id={friend.room}
								onClick={clickFreind}
							>
							<img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1940306/chat_avatar_01.jpg" alt=""></img>
							<div>
									<h2 id="test" >{friend.namef}</h2>
								<h3>
									<span className="status orange"></span>
									offline
								</h3>
							</div>
							</li>
						)}
					</ul>
				</aside>
				<main style={displayMain}>
					<header>
						<img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1940306/chat_avatar_01.jpg" alt=""></img>
						<div>
							<h2>{room}</h2>
							<h3>already 1902 messages</h3>
						</div>
						<img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1940306/ico_star.png" alt=""></img>
					</header>
					{firstClick ?
						(
						<ul id="chat">
						{messagesDB.map((message, i) =>
							<li key={i}
								className= {message['me'].name===nom ? 'you' : 'me'}>
								<div className="entete">
									<span className="status green"></span>
									<h2 >{message['me'].name}</h2>
									<br/>
									<h3>{message['me'].date}</h3>
								</div>
								<div className="triangle"></div>
								{message['me'].type=="text"?(<div className="message">{ReactEmoji.emojify(message['me'].message1)}</div>
)
								
								
								:(<div className="message"><img style={{height:"200px", width:"200px"}} src={'data:image/jpg;base64,' + message['me'].message1}></img></div>
								)}
								
							</li>
						)}
					</ul>
						)
						:
						(
							<ul id="chat">
								{messagesDB.map((message, i) =>
									<li key={i}
										className={message['me'].name===nom ? 'you' : 'me'}>
										<div className="entete">
											<span className="status green"></span>
											<h2>{message['me'].name}</h2>
											<br/>
											<h3>{message['me'].date}</h3>
										</div>
										<div className="triangle"></div>
										{message['me'].type=="text"?
								(
								<div className="message">{ReactEmoji.emojify(message['me'].message1)}</div>)
								:
								(
								<div className="message"><img style={{height:"200px", width:"200px"}} src={'data:image/jpg;base64,' + message['me'].message1}></img></div>
								)}
									</li>
								)}

								
								{messages.map((message, i) =>
									<>
								{message.length <2 ?
								(
									<li key={i}
									className={message[0].user === nom ? 'you' : 'me'}>
									<div className="entete">
										<span className="status green"></span>
										<h2>{message[0].user}</h2>
										<br/>
										<h3>{formattedTime}</h3>
									</div>
									<div className="triangle"></div>
									<div className="message">{ReactEmoji.emojify(message[0].text)}</div>
									
								</li>
								)
								:
								(<li key={i}
										className= {message[0]=== nom ? 'you' : 'me'}>
										<div className="entete">
											<span className="status green"></span>
											<h2>{message[0]}</h2>
											<br/>
											<h3>{formattedTime}</h3>
										</div>
										<div className="triangle"></div>
										<div className="message"><img style={{height:"200px", width:"200px"}} src={message[1]}></img></div>
										
									</li>)}
									</>
								)}
										
									
							</ul>
						)}

                   {selectedFile ? 
				   			(
							<Popup style={{width:10}} open={open} modal position="right center">
							<div>
							<h2>Are you sure about sending this file </h2> 
							<p>File Name: {selectedFile.name}</p> 
							<button onClick={confirm}>Confirm</button>
							<button onClick={cancel}>Cancel</button>
							</div>
							</Popup>
							)
							:
							(
								<></>
							)}
					<footer>
						<textarea placeholder="Type your message..."
							type="text"
							value={message}
							onChange={(event) => setMessage(event.target.value)}
							onKeyPress={event => event.key === 'Enter' ? sendMessage(event) : null}>
						</textarea>
						<label>
						<img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1940306/ico_picture.png" alt=""></img>
						<input type="file"  	value={file} accept=".png,.jpeg,.jpg" onChange={onFileChange} style={{display:"none"}} /> 
						</label>
						<label>
						<img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1940306/ico_file.png" alt="" ></img>
						<input  style={{display:"none"}} /> 
						</label>
						<Link   onClick={sendMessage}>SEND</Link>
						
							
													
					</footer>
				</main>

			</div>
		</div>
	);
}

export default Chat;
