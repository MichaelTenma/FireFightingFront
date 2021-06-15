import {
  Injectable
} from '@angular/core';
import {
  HttpClient
} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  constructor(
    private httpClient: HttpClient
  ) {

  }
  
  public getFromEnd(url: string): Promise<any> {
    url = 'http://localhost:8080/' + url;
    return new Promise((resolve, reject) => {
        this.httpClient.get(url)
        .subscribe((response: any) => {
            if(response.status.code === 200){
                resolve(response.data);
            }else{
                reject(response);
            }
        });
    });
  }

  public get(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        this.httpClient.get(url)
        .subscribe((response: any) => {
          resolve(response);
        });
    });
  }
}
