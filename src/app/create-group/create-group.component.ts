import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, Group, Login } from '../models/chat.model';
import { ChatSocketService } from '../services/chat-socket.service';
import { BsModalRef } from 'ngx-bootstrap/modal';

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
  private chatSocketService:ChatSocketService){}

  groupCreateForm?:FormGroup;
  usersList:User[]=[]

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

  
  this.chatSocketService.createNewGroup({groupName:this.groupCreateForm?.get('groupName')?.value,users: selectedUsers})
}

close(){
  this.bsModalRef.hide();
}

}
