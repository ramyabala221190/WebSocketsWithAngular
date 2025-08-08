import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../services/http.service';
import { Login, User } from '../models/chat.model';
import { ChatSocketService } from '../services/chat-socket.service';
import { Observable, Subject, takeUntil, tap } from 'rxjs';
import { ChatDisplayService } from '../services/chat-display.service';
import { Router } from '@angular/router';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  constructor(private httpService:HttpService,private fb:FormBuilder,private chatService:ChatSocketService,
   private router:Router){}
  userSelectionForm?:FormGroup;
  usersList:User[]=[];
  private destroy$=new Subject<boolean>();

  get userControls(){
    return (<FormArray>this.userSelectionForm?.get('users')).controls;
  }

  ngOnInit(){

    this.userSelectionForm=this.fb.group({
      users:this.fb.array([]),
      selected:this.fb.control("",[Validators.required]) 
      })
   
     this.httpService.getUsers().pipe(takeUntil(this.destroy$)).subscribe((result:Partial<Login>)=>{
       if(result.users){
       this.usersList=result.users;
       this.userSelectionForm?.setControl('users',this.fb.array(this.usersList.map(x=>this.createUserGroup(x))))
       }
     })

  }

  login(){
    this.chatService.login(this.userSelectionForm?.get('selected')?.value).pipe(takeUntil(this.destroy$)).subscribe(
      result=>{
        this.router.navigate(['chat']);
      }
    );
 }


 selectUser(evt:any){
  this.userSelectionForm?.get('selected')?.patchValue(evt.target.value);
}

  createUserGroup(user:User){
    return new FormGroup({
  firstName:this.fb.control(user.username),
  isOnline: this.fb.control(user.isOnline),
  lastName: this.fb.control(user.lastName),
  username: this.fb.control(user.username),
  })
  }

  ngOnDestroy(){
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
