import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, Group, Login } from '../models/chat.model';
import { ChatSocketService } from '../services/chat-socket.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { HttpService } from '../services/http.service';
import { EMPTY, Observable, Subject, catchError, takeUntil, tap } from 'rxjs';

interface UserGroupModel{
  firstName:string,lastName:string,username:string,isOnline:boolean,selected?:boolean
}


@Component({
  selector: 'app-create-group',
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.scss']
})
export class CreateGroupComponent {

  constructor(private fb:FormBuilder,private bsModalRef:BsModalRef,
  private chatSocketService:ChatSocketService,private httpService:HttpService){}

  groupCreateForm?:FormGroup;
  usersList:User[]=[];
  private destroy$=new Subject<boolean>();

  get userGroupListControls(){
    return (<FormArray>this.groupCreateForm?.get('users')).controls;
  }
  

  ngOnInit(){
  this.groupCreateForm=this.fb.group({
    groupName:this.fb.control("",[Validators.required]),
    users:this.fb.array([]) //need to add a validator to check if atleast 1 user is selected from the list
  })

  this.groupCreateForm?.setControl('users',this.fb.array(this.usersList?.map(x=>this.createUserListGroup(x))))

}


createUserListGroup(user:User){
  return new FormGroup({
    firstName:this.fb.control(user.username),
    isOnline: this.fb.control(user.isOnline),
    lastName: this.fb.control(user.lastName),
    username: this.fb.control(user.username),
    selected: this.fb.control(false),
    })
}

createNewGroup(){

   let selectedUsers=(<FormArray>this.groupCreateForm?.get('users'))?.value.reduce((acc:User[],curr:UserGroupModel)=>{
    if(curr.selected){
    let user={...curr};
    delete user.selected;
    acc=acc.concat(user);
    }
    return acc;
   },[])

   this.httpService.createNewGroup(this.groupCreateForm?.get('groupName')?.value,selectedUsers).pipe(
    tap((result:{newGroup:Group})=>{
      this.chatSocketService.createNewGroup({groupId:result.newGroup.groupId})
    }),
    this.handleError().bind(this)
   ).subscribe();
  
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

close(){
  this.bsModalRef.hide();
}

ngOnDestroy(){
  this.destroy$.next(true);
  this.destroy$.complete();
}

}
