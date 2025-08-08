import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {HTTP_INTERCEPTORS, HttpClientModule, HttpResponse} from '@angular/common/http';
import { ChatComponent } from './chat/chat.component';
import { LoginComponent } from './login/login.component';
import { ChatReceiverListComponent } from './chat-receiver-list/chat-receiver-list.component';
import { ChatListComponent } from './chat-list/chat-list.component';
import { CreateGroupComponent } from './create-group/create-group.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { UpperCasePipe } from './upper-case.pipe';
import { AuthInterceptorService } from './services/auth-interceptor.service';
import { HttpService } from './services/http.service';
import { EMPTY, Observable, catchError, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ChatSocketService } from './services/chat-socket.service';

function initialiseApp(
  httpService: HttpService,
  router:Router,
  chatSocketService:ChatSocketService,
): () => Observable<any> {
  return () => httpService.isUserLoggedIn().pipe(
    tap((response:HttpResponse<any>)=>{
      chatSocketService.initiateConnection(response.body.username,response.headers.get('auth-token'))
    }),
    catchError((err)=>{
     router.navigate(['login']);
      return EMPTY;
    })
  )
}

@NgModule({
  declarations: [
    AppComponent,
    ChatComponent,
    LoginComponent,
   ChatReceiverListComponent,
   ChatListComponent,
   CreateGroupComponent,
   UpperCasePipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ModalModule
  ],
  providers: [BsModalService,{
    provide:HTTP_INTERCEPTORS,
    useClass:AuthInterceptorService,
    multi:true
  },
  {
    provide:APP_INITIALIZER,
    deps:[HttpService,Router,ChatSocketService],
    useFactory:initialiseApp,
    multi:true
  }

],
  bootstrap: [AppComponent]
})
export class AppModule { }
