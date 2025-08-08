## Dependencies

https://developer.mozilla.org/en-US/docs/Web/API/WebSocket, if used in the angular app
will only work with the "ws" npm package on the node server.
The ws npm package does not provide many features, which is available with socket.io-client
npm package. Hence we go with socket.io-client npm package for the angular app.
Another reason for using being, we have used socket-io package for the Express server.

npm install --save socket.io-client

--------------------------------------------------------------------------------------------------

## Steps

Express Js server ,on successfull login(here username verification),sends the jwt token in a cookie and also in response header.
Sent in cookie:chatToken so that the cookie will be automatically sent in all http requests because {withCredentials:true} in interceptor.
Sent in response header: auth-token so that it can be extracted,stored in the service and can be easily sent along with WS connection request.
Local and session storage subjected to XSS attacks. Not safe to store token.
With jwt, there should be no option to log out because we cannot invalidate this token. Its a stateless token.
As long as it is valid, it can be reused to authenticate to the server, hence must be stored safely.
Hence no logout functionality in application.

proxy.conf.json not working with ws connections. So I have manually written the localhost and port in service file.



1. The user logs in via the LoginComponent. Below is the login() in the ChatSocketService. 
We are storing the JWT token stored in the auth-token response header in the service.
We are storing the username as well in another service. 
Finally in order to start a WS connection with the server, we are calling startWSConnection(), passing the received
token as argument.
Note that the payload of the JWT token contains the username in the sub field.
```
login(username:string){
    return this.httpService.login(username).pipe(
      tap((response:HttpResponse<any>)=>{
        this.setLoggedInStatus(true);
        this.chatDisplayService.setSenderUser(username);
        const authToken=response.headers.get('auth-token')
        if(authToken !== null){
          this.setAuthToken(authToken);
          this.startWSConnection(this.authToken);
        }
        else{
          console.log("AuthToken not set in headers");
        }
    }))
}
```

2. 
We are establishing that connection in the ChatSocketService inside the startWSConnection().
We are passing the token to the node server so that
it can link the socket connection with the particular user.
In the expressJs server, we are validating the token,decoding it, extracting the username to link it with the socket id.

Note that the WS server and the http server are running on different ports: 8087 and 8088 respectively.
All Http requests will be made to server on port 8088 and all WS requests will be made to server on pot 8087.
On the same browser tab, we dont want multiple socket connections for the same user. So its necessary to check if the socket instance
(created using io()) is
active or not before creating a new connection.
It is fine that in different tabs/browsers/devices,
you can have different connections for the same user.

```
 startWSConnection(token:string|null){
    if(token !== null && !this.connectionWithServerExists()){
    this.socket=io(`ws://localhost:8087/chat`,{
      query:{
        token:token
      }
    });
  

    this.socket.on('connect',()=>{
      console.log(`Connected to ws server on socket ID:${this.socket?.id}`);
    })

    this.socket.on('disconnect',()=>{
      console.log("socket connection disconnected");
    })

    this.socket?.on('connect_error',(err)=>{
      console.log(`Facing issue connecting to server:${err}`);
      this.router.navigate(['/login']);
    })

    this.socket.on('onlineStatus',(data:Online)=>{
      console.log(data);
      this.onlineStatus$.next(data);
    })

    this.socket.on('updateDeliveryStatusOnConnection',(ack:{response:Message})=>{
      console.log(ack)
      this.msgDelivery$.next(ack.response); //ack from server on successfull delivery
    })

    this.socket.on("token-expired",(ack:{response:string})=>{
       console.log(ack);
       this.invalidateSession();
    })

    this.socket?.on('response',(ack:{response:Message},callback)=>{
      const sender=this.chatDisplayService.getSenderUser();
      this.wsSub$.next(ack.response); //ack from server that it is stored in db and sent to recepients
      callback({success:true,receiver:sender}); //sending ack to server that you have received the message
     })

     this.socket?.on('newgrp',(ack:{response:string})=>{
         console.log(ack);
         //refresh the users and group list
         this.groupCreated$.next(true);

     })


    }

  }
```


/chat refers to the chat namespace. We are not using the default namespace /.
Within the chat namespace, we are allocating 1 room per user on the server side.
Also we have 1 room per group of users.

You can test the connection to the WS server on cmd using
curl "http://localhost:8087/socket.io/?EIO=4&transport=polling"


It should return an output similar to this:
C:\Users\User>curl "http://localhost:8087/socket.io/?EIO=4&transport=polling"
0{"sid":"zg_M22WHxNFzTm2mAAAI","upgrades":["websocket"],"pingInterval":25000,"pingTimeout":20000,"maxPayload":1000000}
C:\Users\User>

The io() returns the socket instance. We will listen for all events and also emit all events using this socket instance.
The on() on the instance listens to in-built or custom events from the server.
The emit() on the instance is for emitting custom or in-built events to the server.

Below are 3 in-built events we are listening to: connect,disconnect and connect_error.
Once connection to WS server is established, the connect event is triggered.
Once connection to WS server is disconnected, the disconnect event is triggered.
When there is a error connecting to the WS server, the connect_error event is triggered. Note that reconnections on error are automatic.

```
this.socket.on('connect',()=>{
      console.log(`Connected to ws server on socket ID:${this.socket?.id}`);
    })

    this.socket.on('disconnect',()=>{
      console.log("socket connection disconnected");
    })

    this.socket?.on('connect_error',(err)=>{
      console.log(`Facing issue connecting to server:${err}`);
    })


```

4. To send events to the server, we use the emit() and can also receive the ack from the
server for the same event. We have sent an event named "groupMessage", with some payload data
and in the 3rd argument, you can see the callback function, where we are using the response
from the server for this event.

this.socket?.emit('groupMessage',payload,(ack:MessageAck)=>{
          console.log(ack)
          if(ack.success){
            this.msgDelivery$.next(ack.response); //ack from server on successfull delivery
          }
          else{
            console.log("message failed to deliver")
          }
      });

Note, if you are expecting a response from the server on the event, dont forget to add the callback function in the emit().

5. We listen for events from the server using the on() as below. We are extracting data sent by the server from the 2nd argument.
The 3rd argument is callback function, which is used to send a response back to the server for this particular event.

  this.socket?.on('response',(ack:{response:Message},callback)=>{
      const sender=this.chatDisplayService.getSenderUser();
      this.wsSub$.next(ack.response); //ack from server that it is stored in db and sent to recepients
      callback({success:true,receiver:sender}); //sending ack to server that you have received the message
     })


6. We can call the disconnect() method of the socket property to disconnect the connection
with the server. We are doing it everytime, the JWT token expires and redirecting to login page.

```
 invalidateSession(){
    this.chatDisplayService.setSenderUser(null);
    this.setLoggedInStatus(false);
    if(this.socket){
      console.log("disconnecting");
    this.socket?.disconnect();
    }
    this.router.navigate(['/login']);
  }

```

7. When you close the browser or refresh the browser or deliberately close the connection, you are ending the WS connection with the server.

In app.module.ts using APP_INITIALISER, we are checking if the current JWT token in the cookie is still valid by making a http request.
If yes, all we need to do is start a new WS connection with the server. If no, redirect to login page.
This is important everytime we refresh the browser so that a new WS connection can be started for the same JWT token and the connection
is retained as long as token is valid.

```
function initialiseApp(
  httpService: HttpService,
  router:Router,
  chatSocketService:ChatSocketService,
): () => Observable<any> {
  return () => httpService.isUserLoggedIn().pipe(
    tap((response:HttpResponse<any>)=>{
      chatSocketService.initiateConnection(response.body.username,response.headers.get('auth-token'))
    }),
    catchError((err)=>{
     router.navigate(['login']);
      return EMPTY;
    })
  )
}




```


8. You can load the application in different browsers: Chrome,Edge,Firefox etc and login
as different users to test private and group messages.
