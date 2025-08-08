import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'upperCase'
})
export class UpperCasePipe implements PipeTransform {

  transform(value: string|null): string|null {
    if(value !== null){
    return value.toUpperCase();
    }
    return value;
  }

}
