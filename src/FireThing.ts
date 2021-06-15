
export class FireThing {
  private name: String;
  private url: String;
  private money: number;
  // private style: Style;

  constructor(name: String, url: String, money: number) {
    this.name = name;
    this.url = url;
    this.money = money;
    // this.style = new Style({
    //   image: new Icon({
    //     src: this.url,
    //     scale: scale
    //     // imgSize:[50, 50],
    //   })
    // });
  }

  public compareName(name: String): FireThing {
    return name === this.name ? this : null;
  }

  public getUrl(): String {
    return this.url;
  }

  public getName(): String {
    return this.name;
  }

  public getMoney(): number {
    return this.money;
  }

  // public getStyle(): Style {
  //   return this.style;
  // }

}
