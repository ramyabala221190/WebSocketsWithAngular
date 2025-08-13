export interface User{
    firstName:string,
    lastName:string,
    username:string,
    isOnline:boolean
}

export interface Message{
    sender:string,
    receiver:string,
    content:string,
    timestamp:Date,
    deliveredToAll:boolean,
    messageId:string
}

export interface Group{
    groupName:string,
    groupId:string,
    users:User[],
    messages:Message[],
    createdAt:Date
}

export interface Login{
    users:User[],
    groups:Group[]
}

export interface Online{
    username:string|null,
    online:boolean;
}

export interface MessageAck{
    success:boolean,
    response:Message
}

export interface MessageList{
    success:boolean,
    response:Message[]
}

export interface CreateGroup{
    groupName:string,
    users:User[]
}

export interface CommonMessage{
    sender:string,
    receiver:string,
    content:string
}

