import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ChatDisplayService } from './services/chat-display.service';
import { ChatSocketService } from './services/chat-socket.service';

function getLoggedInStatus(){
  const chatSocketService = inject(ChatSocketService);
  return chatSocketService.getLoggedInStatus();
}


export const authGuard: CanActivateFn = (route, state) => {
  const router=inject(Router);
  const isUserLoggedIn=getLoggedInStatus();
   if(isUserLoggedIn){
    console.log("User is loggedin. Proceed to chat")
     return true;
   }
   else{
    console.log("User is not loggedin. Proceed to login")
    router.navigate(['login']);
    return false;
   }
};

export const loginGuard: CanActivateFn = (route, state) => {
  const router=inject(Router);
  const isUserLoggedIn=getLoggedInStatus();
  if(isUserLoggedIn){
    console.log("User is loggedin. Proceed to chat")
    router.navigate(['chat']);
     return false;
   }
   else{
    console.log("User is not loggedin. Proceed to login")
    return true;
   }
};
