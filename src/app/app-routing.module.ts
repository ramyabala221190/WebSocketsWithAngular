import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ChatComponent } from './chat/chat.component';
import { authGuard, loginGuard } from './auth.guard';
import { ChatReceiverListComponent } from './chat-receiver-list/chat-receiver-list.component';
import { ChatListComponent } from './chat-list/chat-list.component';

const routes: Routes = [
  {
    path:"login",
    component:LoginComponent,
    canActivate:[loginGuard]
  },
  {
    path:"chat",
    component:ChatComponent,
    canActivate:[authGuard],
    canActivateChild:[authGuard],
    children:[
      { 
        path:'receiver',
        component:ChatReceiverListComponent
      },
      {
        path:'list/:username/:displayName',
        component:ChatListComponent
      },
    ]
  },
  {
    path:"",
    pathMatch:"full",
    redirectTo:"/chat"
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
