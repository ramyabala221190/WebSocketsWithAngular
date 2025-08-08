import { Component } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Observable, Subject, catchError, mergeMap, of, takeUntil, tap } from 'rxjs';
import { Message, MessageList } from '../models/chat.model';
import { ChatSocketService } from '../services/chat-socket.service';
import { HttpService } from '../services/http.service';
import { ChatDisplayService } from '../services/chat-display.service';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss']
})
export class ChatListComponent {
   
   constructor(private router:Router,private httpService:HttpService,
    private activeRoute:ActivatedRoute,private chatService:ChatSocketService,private chatDisplayService:ChatDisplayService){}

   selectedUser:string|null=null;
   message:string="";
   messages:Message[]=[];
   sender:string|null=null;
   receiverName:string|null=null;
   private destroy$=new Subject<boolean>();


   ngOnInit(){
    this.sender=this.chatDisplayService.getSenderUser();

    this.chatService.getMessageDeliveryUpdates().pipe(takeUntil(this.destroy$)).subscribe((result:Message|null)=>{
      if(result !== null){
        this.chatDisplayService.updateDeliveryStatus(result.messageId,result.deliveredToAll);
        let messages=this.chatDisplayService.getMessages();
        this.displayMessages(messages);
      }
    })

    this.chatService.receiveMessages().pipe(takeUntil(this.destroy$)).subscribe((result:Message|null)=>{
      if(result !== null){
      this.appendNewMessage(result);
      }
      //this.displayMessages(result);
    })

     this.activeRoute.paramMap.pipe(
      mergeMap((result)=>{
         this.selectedUser=result.get('username');
         this.receiverName=result.get('displayName');
         const isGroup=this.activeRoute.snapshot.queryParamMap.get('group');
         if(this.selectedUser !== null && this.sender !== null && isGroup !== null){
          return this.httpService.getMessagesForUserOrGroup(this.sender,this.selectedUser,isGroup)
          .pipe(
            tap((result:Message[])=>{
                this.chatDisplayService.setMessages(result);
               this.displayMessages(result);
          })
          
          )
         }
         return of(null);
     }),
     takeUntil(this.destroy$)
   ).subscribe();
    }

    back(){
      this.router.navigate(['/chat/receiver'])
    }

    appendNewMessage(message:Message){
      this.chatDisplayService.updateMessages(message);
      let updatedMessagesList:Message[]=this.chatDisplayService.getMessages();
      this.displayMessages(updatedMessagesList)
    }

    displayMessages(result:Message[]){
      let groupMessages=[];
      let privateMessages=[];
  
      if(this.activeRoute.snapshot.queryParamMap.get('group') === "yes"){
        //group messages
        groupMessages=result.filter(x=>x.receiver == this.selectedUser);
        if(groupMessages.length > 0){
          this.messages=groupMessages;
        }
      }
      else{
         privateMessages=result.filter(x=>x.sender == this.selectedUser || x.receiver == this.selectedUser);
         //private messages.
         if(privateMessages.length > 0){
          this.messages=privateMessages;
         }
      }
    }

    sendMessage(){
      if(this.sender !== null && this.selectedUser !== null){
      this.chatService.sendMessage({
        sender: this.sender,
        receiver: this.selectedUser,
        content:this.message,
      },
      this.activeRoute.snapshot.queryParamMap.get('group') === "yes"
      )
    }
    else{
      console.log("sender or receiver is null");
    }
    }

    ngOnDestroy(){
      this.destroy$.next(true);
      this.destroy$.complete();
    }
}
