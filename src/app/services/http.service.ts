import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Login, Message } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http:HttpClient) { }

  getUsers():Observable<Partial<Login>>{
    return this.http.get<Partial<Login>>(`${environment.httpbackendUrl}/users`);
  }

  getUsersAndGroups(username:string):Observable<Login>{
    return this.http.get<Login>(`${environment.httpbackendUrl}/all/${username}`);
  }

  getMessagesForUserOrGroup(sender:string,receiver:string,group:string):Observable<Message[]>{
    return this.http.get<Message[]>(`${environment.httpbackendUrl}/messages/${sender}/${receiver}?group=${group}`);
  }

  login(username:string):Observable<any>{
    return this.http.post<{response:string}>(`${environment.httpbackendUrl}/login`,{username:username},{observe:'response'});
  }

  isUserLoggedIn(){
    return this.http.get(`${environment.httpbackendUrl}/loggedIn`,{observe:'response'});
  }

  
}
