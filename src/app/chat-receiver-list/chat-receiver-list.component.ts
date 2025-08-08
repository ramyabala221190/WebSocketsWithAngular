import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Group, Login, User } from '../models/chat.model';
import { NavigationStart, Router } from '@angular/router';
import { ChatDisplayService } from '../services/chat-display.service';
import { ChatSocketService } from '../services/chat-socket.service';
import { HttpService } from '../services/http.service';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { CreateGroupComponent } from '../create-group/create-group.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'chat-receiver-list',
  templateUrl: './chat-receiver-list.component.html',
  styleUrls: ['./chat-receiver-list.component.scss']
})
export class ChatReceiverListComponent {

  usersList:User[]=[];
  userListForGroup:User[]=[]
  groupList:Group[]=[];
  sender:string|null=null;
  private destroy$=new Subject<boolean>();

  constructor(private chatDisplayService:ChatDisplayService,private router:Router,
    private chatSocketService:ChatSocketService,
    private httpService:HttpService, private bsModalRef: BsModalRef,private modalService: BsModalService   ){}

  ngOnInit(){

    this.sender=this.chatDisplayService.getSenderUser();
    this.chatDisplayService.setSenderUser(this.sender);
    

     //update the online status of users and users inside the group
     this.chatSocketService.getOnlineStatus().pipe(takeUntil(this.destroy$)).subscribe(result=>{
      if(result.username && result.username.length){
        let userIndex=this.usersList.findIndex(x=>x.username == result.username);
        if(userIndex !== -1){
          this.usersList[userIndex].isOnline=result.online;
        }

        this.groupList.forEach(group=>{
          let groupUserIndex= group.users.findIndex(x=>x.username == result.username);
          if(groupUserIndex !== -1){
            group.users[groupUserIndex].isOnline=result.online;
          }
        })
        
        }
      })

    this.chatSocketService.getGroupCreatedStatus().pipe(takeUntil(this.destroy$)).subscribe((result:boolean)=>{
        if(result){
          this.bsModalRef.hide();
          console.log("groups added..refresh list")
           this.fetchUsersAndGroups(); //refresh
        }
    })

    this.fetchUsersAndGroups();
  
      
  }

  createGroup(){
    const initialState: ModalOptions = {
      initialState: {
        usersList:this.userListForGroup
      }
    };
    this.bsModalRef = this.modalService.show(CreateGroupComponent, initialState);
  }

  fetchUsersAndGroups(){
    if(this.sender !== null){
    this.httpService.getUsersAndGroups(this.sender).pipe(takeUntil(this.destroy$)).subscribe((result:Login)=>{
      this.sender=this.chatDisplayService.getSenderUser();
      this.userListForGroup=result.users;
      this.usersList=result.users.filter(x=>x.username !== this.sender);
      this.groupList=result.groups;
    })
  }
  }

  showChatScreen(nameOrId:string|number,group:boolean,displayName:string){
    this.chatDisplayService.setReceiverUserOrGroup(nameOrId.toString(),group,displayName);
  }

  ngOnDestroy(){
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
