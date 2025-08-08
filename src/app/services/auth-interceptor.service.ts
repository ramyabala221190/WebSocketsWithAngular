import { HttpErrorResponse, HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, catchError, of, throwError } from 'rxjs';
import { ChatDisplayService } from './chat-display.service';
import { ChatSocketService } from './chat-socket.service';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorService implements HttpInterceptor {

  constructor(private chatSocketService:ChatSocketService) { }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let modifiedReq=req.clone({
      withCredentials:true
    })
    return next.handle(modifiedReq).pipe(
      catchError((err:HttpErrorResponse)=>{
        console.log(err);
        if(err.status == 401){
            this.chatSocketService.invalidateSession();
            return EMPTY;
        }
          return throwError((err:HttpErrorResponse)=>new Error(err.message));
      })
    );
  }
}
