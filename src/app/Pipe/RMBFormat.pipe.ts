import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rmbFormat'
})
export class RMBFormatPipe implements PipeTransform {

  transform(value: number, ...args: number[]): string {
    return `￥${ value / 10000 }万元`;
  }

}
