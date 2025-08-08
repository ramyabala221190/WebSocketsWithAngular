import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatDisplayService {

  constructor() { }

  private userOrGroupReceiverName$= new BehaviorSubject<{name:string|null,group:boolean,displayName:string}|null>(null);
  private senderUser:string|null=null;
  private messagesList:Message[]=[];

  setReceiverUserOrGroup(name:string,group:boolean,displayName:string){
     this.userOrGroupReceiverName$.next({name:name,group:group,displayName:displayName});
  }

  setMessages(messages:Message[]){
     this.messagesList=messages;
  }

  updateMessages(message:Message){
    let entry= this.messagesList.find(x=>x.messageId == message.messageId);
    if(!entry){
      this.messagesList.push(message);
    }
  }

  updateDeliveryStatus(messageId:string,deliveredToAll:boolean){
      let messageIndex=this.messagesList.findIndex(x=>x.messageId == messageId);
      if(messageIndex !== -1){
        this.messagesList[messageIndex].deliveredToAll=deliveredToAll;
      }
  }

  getMessages(){
    return this.messagesList;
  }

  setSenderUser(name:string|null){
    this.senderUser=name;
  }



  getSenderUser(){
    return this.senderUser;
  }


  getReceiverUserOrGroup(){
    return this.userOrGroupReceiverName$.asObservable();
  }


}
