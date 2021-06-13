import {
  Directive,
  ElementRef,
  HostListener,
  Renderer2
} from '@angular/core';

@Directive({
  selector: '[appSelected]'
})
export class SelectedDirective {
  private lastIndex = -1;
  constructor(
    private el: ElementRef,
    private renderer2: Renderer2
  ) {
    this.el = el;
  }

  @HostListener('click', ['$event']) onClick(event : any) {
    var target = event.path[0].attributes.index === undefined ? event.path[1] : event.path[0];
    var index = target.index;
    if(index === undefined) return;

    if(this.lastIndex >= 0 && this.lastIndex < this.el.nativeElement.children.length || this.lastIndex === index){
      this.renderer2.setStyle(this.el.nativeElement.children[this.lastIndex], "backgroundColor", "");
    }
    if(this.lastIndex !== index){
      this.renderer2.setStyle(this.el.nativeElement.children[index], "backgroundColor", "rgba(0, 0, 0, 0.1)");
    }
    this.lastIndex = index;
  }

  select(color: String) {
    this.el.nativeElement.style.backgroundColor = color;
  }

}
