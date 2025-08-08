import { TestBed } from '@angular/core/testing';

import { ChatDisplayService } from './chat-display.service';

describe('ChatDisplayService', () => {
  let service: ChatDisplayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatDisplayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
