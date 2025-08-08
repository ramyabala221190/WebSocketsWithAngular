import { Injectable } from '@angular/core';
import { BehaviorSubject, scan, tap } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { CommonMessage, CreateGroup, Message, MessageAck, MessageList, Online } from '../models/chat.model';
import { ChatDisplayService } from './chat-display.service';
import { HttpService } from './http.service';
import { HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ChatSocketService {

  constructor(private chatDisplayService:ChatDisplayService,private httpService:HttpService,private router:Router) { }

  socket?:Socket;
  private wsSub$=new BehaviorSubject<Message|null>(null);
  private userLoggedIn:boolean=false;
  private authToken:string="";
  private groupCreated$=new BehaviorSubject<boolean>(false);
  private onlineStatus$=new BehaviorSubject<Online>({username:null,online:false});
  private msgDelivery$=new BehaviorSubject<Message|null>(null);

  setLoggedInStatus(status:boolean){
    this.userLoggedIn=status;
  }

  getLoggedInStatus(){
    return this.userLoggedIn;
  }

  setAuthToken(token:string){
    this.authToken=token;
  }

  getAuthToken(){
    return this.authToken;
  }

  getOnlineStatus(){
    return this.onlineStatus$.asObservable();
  }

  getGroupCreatedStatus(){
    return this.groupCreated$.asObservable();
  }

  receiveMessages(){
    return this.wsSub$.asObservable()
   }

  getMessageDeliveryUpdates(){
    return this.msgDelivery$.asObservable();
  }


  createNewGroup(payload:CreateGroup){
    this.socket?.emit('createGroup',payload,(ack:MessageAck)=>{
      console.log(ack);
    });
  }

  connectionWithServerExists(){
    console.log("Socket active ? ",this.socket?.active)
    return this.socket?.active;
  }

  invalidateSession(){
    this.chatDisplayService.setSenderUser(null);
    this.setLoggedInStatus(false);
    if(this.socket){
      console.log("disconnecting");
    this.socket?.disconnect();
    }
    this.router.navigate(['/login']);
  }

  login(username:string){
    return this.httpService.login(username).pipe(
      tap((response:HttpResponse<any>)=>{
       const authToken=response.headers.get('auth-token')
       this.initiateConnection(username,authToken)
    }))
    }

  initiateConnection(username:string,authToken:string|null){
    this.setLoggedInStatus(true);
    this.chatDisplayService.setSenderUser(username);
    if(authToken !== null){
      this.setAuthToken(authToken);
      this.startWSConnection(this.authToken);
    }
    else{
      console.log("AuthToken not set in headers");
    }
  }

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

  sendMessage(payload:CommonMessage,group:boolean){
    if(group){
      this.socket?.emit('groupMessage',payload,(ack:MessageAck)=>{
          console.log(ack)
          if(ack.success){
            this.msgDelivery$.next(ack.response); //ack from server on successfull delivery
          }
          else{
            console.log("message failed to deliver")
          }
      });
    }
    else{
      this.socket?.emit('privateMessage',payload,(ack:MessageAck)=>{
        console.log(ack);
        if(ack.success){
          this.msgDelivery$.next(ack.response); //ack from server on successfull delivery
        }
        else{
          console.log("message failed to deliver")
        }
    });
    }
  }

  logout(){
    this.socket?.close();
  }
}
