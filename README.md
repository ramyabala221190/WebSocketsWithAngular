## Dependencies

https://developer.mozilla.org/en-US/docs/Web/API/WebSocket, if used in the angular app
will only work with the "ws" npm package on the node server.
The ws npm package does not provide many features, which is available with socket.io-client
npm package. Hence we go with socket.io-client npm package for the angular app.
Another reason for using being, we have used socket-io package for the Express server.

npm install --save socket.io-client


Generating certificates in C:/Users/User/certificates/angular

The passphrase.txt contains the passphrase for private.key and config.ext is manually created.

openssl genrsa -des3 -out private.key 2048

openssl req -key private.key -new -out certSignReq.csr

openssl x509 -signkey private.key -extfile config.ext -in certSignReq.csr -req -days 365 -out selfSigned.crt

--------------------------------------------------------------------------------------------------
## Starting application

Locally, execute "npm run start"


For Docker, execute the below commands for build and run
Observe the -p flag. This helps to differentiate the angular and node projects so that there
is no conflict when running the images. When a docker image is run, it is run under a project name, which by defaut
is the folder name under which docker-compose file is present. 
In both projects, it is docker. So only the node or angular project containers can run. One of them will get removed, when the
other starts.
So its essential to add -p flag


For development:
```

docker compose -p ws-dev-angular -f docker/docker-compose.yml -f docker/docker-compose.dev.yml build
docker compose -p ws-dev-angular -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d --remove-orphans --no-build

```

For production:

```
docker compose -p ws-prod-angular -f docker/docker-compose.yml -f docker/docker-compose.prod.yml build
docker compose -p ws-prod-angular -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d --remove-orphans --no-build

```

----------------------------------------------------------------------------------------------------
### Structure

The architecture diagram is in assets/arch.png

Local Working

As per the environment files and proxy.conf.json, we will be routing all
/web/* requests to localhost:8091 and all /chat requests(which ultimately becomes /socket.io/ request) will be routed to localhost:8092.

In the chat socket service, we are referencing /chat from environment file

```
 this.socket=io(`${environment.wsbackendUrl}`,{
      query:{
        token:token
      }
    });

```

In the http.service.ts file, we are referencing /web again from environement.ts file

Deployment using Docker Compose

We are deploying the angular application to nginx webserver in a Docker container.
Nginx will function as a webserver to serve static files and also proxying requests to the backend node express server.

We have development and prodution version of the angular app.

Observe the docker-compose.dev.yml.
8082 is the host port and 3000 is the container port.
When you hit angularws-dev:8082 in the browser, the request is forwarded to the nginx webserver listening on port 3000
in the docker container. The nginx webserver is serving the angular app in the docker container.
We have set up a volume for the nginx-dev.config instead of doing a COPY in the Dockerfile.
The advantage here is that if I update the nginx-dev.config in the source code, I just need to restart the docker container
to make the changes reflect.
If I do a COPY in the Dockerfile, for any changes in the nginx-dev.config to reflect, we have to redo the docker build and 
run the container.

```
services:
   ws-frontend:
     build:
      args:  #these args are available during build time
           - targetEnv=dev
     env_file: environments/dev.env
     container_name: ws-frontend-dev-container
     image: ws-frontend-dev-nginx
     ports:
       - 8082:3000
     volumes:
       - ../nginx/nginx-dev.config:/etc/nginx/templates/default.conf.template

```

Moving to nginx-dev.config.

The below 2 variables will be read from dev.env and common.env. The nginx webserver will be listening on port 3000
and the server name will be angularws-dev

```
listen ${CLIENT_NGINX_PORT};
server_name ${SERVER_NAME};

```

All /web/ requests will be routed to ws-backend-nginx docker service, which is nothing but a nginx server listening on port 3002
All /socket.io/ requests will be routed to the same ws-backend-nginx docker service on port
3002. So the docker service and port remains the same. What changes is the path after it.
Based on whether it is /web or /socket.io, the ws-backend-nginx docker service will decide
to which server to route it to i.e to the server listening for web requests or listening for
socket.io requests

```
   location /web/{
            proxy_pass http://${BACKEND_NGINX_NAME}:${BACKEND_NGINX_PORT}/web/;
        }

        location /socket.io/{
            proxy_pass http://${BACKEND_NGINX_NAME}:${BACKEND_NGINX_PORT}/socket.io/;
        }


```

Lets now check the docker-compose.prod.yml
The nginx server is listening on port 3004 and the angular app is listening on port 8083.
Thus https://angularws-prod:8083, forwards the request to the nginx server listening on port 3004.

```
services:
   ws-frontend:
     build:
      args:  #these args are available during build time
        - targetEnv=prod
     env_file: environments/prod.env
     container_name: ws-frontend-prod-container
     image: ws-frontend-prod-nginx
     ports:
       - 8083:3004
     volumes:
       - C:/Users/User/certificates/angular/private.key:/etc/nginx/ssl/private.key
       - C:/Users/User/certificates/angular/selfSigned.crt:/etc/nginx/ssl/selfSigned.crt
       - C:/Users/User/certificates/angular/passphrase.txt:/etc/nginx/ssl/passphrase.txt
       - ../nginx/nginx-prod.config:/etc/nginx/templates/default.conf.template

```

Moving to nginx-prod.config. Nginx web server in production environment is listening on port 3004 and the server name is angularws-prod.
The purpose of the Strict-Transport-Security header ensures that requests to all resources are made on https.

```  
    server{
    listen ${CLIENT_NGINX_PORT} ssl;
    server_name ${SERVER_NAME};
    default_type application/octet-stream;
    error_log /var/log/nginx/error.log debug;
    ssl_certificate /etc/nginx/ssl/selfSigned.crt;
    ssl_certificate_key /etc/nginx/ssl/private.key;
    ssl_password_file /etc/nginx/ssl/passphrase.txt;


    gzip                    on;
    gzip_comp_level         6;
    gzip_vary               on;
    gzip_min_length         1000;
    gzip_proxied            any;
    gzip_types              text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_buffers            16 8k;
    client_max_body_size    256M;

    add_header 'Strict-Transport-Security' 'max-age=63072000; includeSubDomains; preload'; ## to ensure there are no insecure requests

    root /usr/share/nginx/html;


        location /web/{
            proxy_pass https://${BACKEND_NGINX_NAME}:${BACKEND_NGINX_PORT}/web/;
        }

        location /socket.io/{
            proxy_pass https://${BACKEND_NGINX_NAME}:${BACKEND_NGINX_PORT}/socket.io/;
        }

        location /assets/ {
         autoindex on;
        }

        location / {
        try_files $uri $uri/ $uri/index.html =404;
        }
        error_page  404              /index.html;
    }

```


All /web/ requests will be routed to ws-backend-nginx docker service, which is nothing but a nginx server listening on port 9000
All /socket.io/ requests will be routed to the same ws-backend-nginx docker service on port
9000. So the docker service and port remains the same. What changes is the path after it.
Based on whether it is /web or /socket.io, the ws-backend-nginx docker service will decide
to which server to route it to i.e to the server listening for web requests or listening for
socket.io requests.

-----------------------------------------------------------------------------------------------------

## Docker Networking

The Angular app and the Node app are on different networks: ws-front_app_network and ws-back_app_network respectively.

In order for the angular app, to communicate with the Node app, the former must also be a part of the ws-back_app_network
and vice-versa.

In the docker-compose.yml, we have defined all the networks. We have defined each network under a name.
So ws-front_app_network is defined under a name:mynetwork and ws-back_app_network is defined under a name: backend.
Since ws-back_app_network is an external network to connect to, we have set "external" to true.


```
networks:
  mynetwork:
    name: ws-front_app_network
    driver: bridge
  backend:
    name: ws-back_app_network
    external: true
  
```

Where have we used there names ? We have assigned the networks to each service as below:

 networks:
      - mynetwork
      - backend

-------------------------------------------------------------------------------------------------------

## Steps

Express Js server ,on successfull login(here username verification),sends the jwt token in a cookie and also in response header.
Sent in cookie:chatToken so that the cookie will be automatically sent in all http requests because {withCredentials:true} in interceptor.
Sent in response header: auth-token so that it can be extracted,stored in the service and can be easily sent along with WS connection request.
Local and session storage subjected to XSS attacks. Not safe to store token.
With jwt, there should be no option to log out because we cannot invalidate this token. Its a stateless token.
As long as it is valid, it can be reused to authenticate to the server, hence must be stored safely.
Hence no logout functionality in application.


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

If running locally, the proxy.conf.json is used. If using docker, the proxy mapping happens in nginx config.

Note that the WS server and the http server are running on different ports: 8091 and 8092 respectively.
All Http requests will be made to server on port 8091 and all WS requests will be made to server on port 8092.
On the same browser tab, we dont want multiple socket connections for the same user. So its necessary to check if the socket instance
(created using io()) is
active or not before creating a new connection.
It is fine that in different tabs/browsers/devices,
you can have different connections for the same user.

```
 startWSConnection(token:string|null){
    if(token !== null && !this.connectionWithServerExists()){
    this.socket=io(`${environment.wsbackendUrl}`,{
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
curl "http://localhost:8092/socket.io/?EIO=4&transport=polling"


It should return an output similar to this:
C:\Users\User>curl "http://localhost:8092/socket.io/?EIO=4&transport=polling"
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
