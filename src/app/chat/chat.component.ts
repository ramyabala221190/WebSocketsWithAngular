import { Component } from '@angular/core';
import { ChatDisplayService } from '../services/chat-display.service';
import { Router } from '@angular/router';
import { ChatSocketService } from '../services/chat-socket.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent {

constructor(private chatDisplayService:ChatDisplayService,private router:Router,private chatSocketService:ChatSocketService){
    this.router.navigate(['/chat/receiver']);
}

sender:string|null=null;
private destroy$=new Subject<boolean>();


ngOnInit(){
  this.sender=this.chatDisplayService.getSenderUser();
  this.chatDisplayService.getReceiverUserOrGroup().pipe(takeUntil(this.destroy$)).subscribe((result:{name:string|null,group:boolean,displayName:string}|null)=>{
     if(result !== null){
        this.router.navigate(['/chat/list',result.name,result.displayName],{queryParams:{group:result.group ? "yes": "no"}});
     }
  })

  }

  ngOnDestroy(){
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
