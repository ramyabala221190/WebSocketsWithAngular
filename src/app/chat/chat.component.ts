import { Component } from '@angular/core';
import { ChatDisplayService } from '../services/chat-display.service';
import { Router } from '@angular/router';
import { ChatSocketService } from '../services/chat-socket.service';
import { EMPTY, Observable, Subject, catchError, takeUntil } from 'rxjs';

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
  this.chatDisplayService.getReceiverUserOrGroup().pipe(this.handleError().bind(this)).subscribe((result:{name:string|null,group:boolean,displayName:string}|null)=>{
     if(result !== null){
        this.router.navigate(['/chat/list',result.name,result.displayName],{queryParams:{group:result.group ? "yes": "no"}});
     }
  })

  }

  handleError(){
    let that=this;
    return function(observable:Observable<any>){
      return observable.pipe(
        catchError((err)=>{
          console.log(err);
          return EMPTY;
        }),
        takeUntil(that.destroy$)
      )
    }
  }


  ngOnDestroy(){
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
