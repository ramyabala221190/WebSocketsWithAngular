import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatReceiverListComponent } from './chat-receiver-list.component';

describe('ChatReceiverListComponent', () => {
  let component: ChatReceiverListComponent;
  let fixture: ComponentFixture<ChatReceiverListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChatReceiverListComponent]
    });
    fixture = TestBed.createComponent(ChatReceiverListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
