import {
  timer
} from 'rxjs';
import {
  Injectable
} from '@angular/core';

/**
 * 将真实世界的时间换算成游戏时间的时间
 */
function transformTimeToGameTimeSecond(realTimeSecond: number, gameTimeScale: number): number {
  return realTimeSecond * gameTimeScale;
}

function transformGameTimeToTimeSecond(gameTimeSecond: number, gameTimeScale: number): number {
  return gameTimeSecond / gameTimeScale;
}

export class Task {
  /* 真实世界时间何时开始等待，用于计算等待了多久 */
  private beginRealTime: number;

  /* 每次等待的游戏世界时间 */
  private readonly gameTimeSecond: number;
  private task: Function;
  private observable: any;

  private repeat: boolean;

  /* 当前轮是否已经开始执行 */
//   private hasCurrentRun: boolean;

//   private hasDone: boolean = false;
private restRunTime: number;

  /**
   * 就是让task在游戏时间中t秒后执行
   */
  constructor(gameTimeSecond: number, task: Function, repeat: boolean) {
    this.gameTimeSecond = gameTimeSecond;
    this.task = task;
    this.observable = null;
    this.repeat = repeat;
    this.restRunTime = 0;
    // this.timeScale = gameTimeScale;
    this.resetRun();
  }

  /**
   * 计算时间倍速改变后任务还需要等待多久，fixGameTime与waitRealTime的时间单位要一致，如均为秒
   */
  private static calNeedRealTimeSecond(fixGameTimeSecond: number, waitRealTimeSecond: number, lastTimeScale: number, currentTimeScale: number) {
    return transformGameTimeToTimeSecond(
      (fixGameTimeSecond - transformTimeToGameTimeSecond(waitRealTimeSecond, lastTimeScale)), currentTimeScale
    );
  }

  public run(lastTimeScale: number, currentTimeScale: number) {
    let waitRealTimeSecond = Task.calWaitRealTimeSecond(this.getBeginRealTime());
    this.setBeginRealTime();

    /* 将计算固定游戏时间当前游戏速度下的真实时间 */
    let fix_realTime_ms: number = 1000 * transformGameTimeToTimeSecond(this.gameTimeSecond, currentTimeScale);

    let left_realTime_ms = 1000 * Task.calNeedRealTimeSecond(this.gameTimeSecond, waitRealTimeSecond, lastTimeScale, currentTimeScale);
    // console.log(this.gameTimeSecond, waitRealTimeSecond, this.timeScale, gameTimeScale, left_realTime_ms);

    let bodyTask: Function = (e: Task) => {
      /**
       * 保护正在执行的程序，避免被中断，
       * 如果发生中断可以在下一次瞬间立刻恢复 
       */
    //   e.hasDone = false;
    //   e.hasCurrentRun = true;
        
      e.task();
      this.restRunTime --;
      this.resetRun();
    //   e.hasDone = true;
    };

    let observable: any;
    if (this.repeat) {
      /* 重复执行的任务，执行等待剩余的当前任务真实世界时间 */
      /* 后续间隔固定的真实世界时间 */
      observable = timer(left_realTime_ms, fix_realTime_ms).subscribe(() => {
        bodyTask(this);
      });
    } else {
      /* 非重复任务只需要执行完剩余时间即可，注意第一次执行的时候，剩余时间需要等于间隔时间 */
      observable = timer(left_realTime_ms).subscribe(() => {
        bodyTask(this);
      });
    }
    this.setObservable(observable);
  }

  private setObservable(observable: any) {
    this.observable = observable;
  }

  public getObservable(): any {
    return this.observable;
  }

  private setBeginRealTime() {
    this.beginRealTime = new Date().getTime();
    // console.log("时间更新");
  }

  private getBeginRealTime(): number {
    return this.beginRealTime;
  }

  /**
   * 计算当前任务等待了多长的真实世界时间
   */
  private static calWaitRealTimeSecond(beginRealTime: number) {
    if (!beginRealTime) return 0;
    let currentRealTime = (new Date()).getTime();
    let deltaRealTime = (currentRealTime - beginRealTime);
    let waitRealTimeSecond = deltaRealTime / 1000;
    return waitRealTimeSecond;
  }

  public hasNextRun(): boolean {
    /* 如果当前任务不是重复任务，且已经开始执行，但已经执行完成，则不需要执行 */
    /* 其余所有情况都需要继续执行，不用另外计算还需要执行多久 */
    // return !(this.repeat === false && this.hasCurrentRun && this.hasDone); // 
    return this.restRunTime > 0;
  }

  private resetRun() {
    // this.hasCurrentRun = false;
    if(this.repeat){
        this.restRunTime ++;
    }
    this.setBeginRealTime();
  }

  public cancel() {
    let observable = this.getObservable();
    if (!!observable) {
      console.log("change scale: 取消任务");
      observable.unsubscribe();
    }
  }

}

@Injectable({
  providedIn: 'root',
})
export class GameTimeService {
  private tasks: Task[];

  private gameTime: number; /* 1970时间戳，毫秒 */
  private lastGameTimeScale: number; /* 上一次的游戏速度 */
  private gameTimeScale: number; /* 游戏速度 */
  private lastRealTime: number;

  constructor() {
    this.tasks = [];
    this.gameTime = (new Date()).getTime();
    this.lastRealTime = this.gameTime;
    this.gameTimeScale = 1.0;
    this.lastGameTimeScale = this.gameTimeScale;
  }

  /**
   * 修正游戏时间
   */
  private modifyGameTime(lastGameTimeScale: number) {
    let currentRealTime = (new Date()).getTime();
    let deltaRealTime = currentRealTime - this.lastRealTime;
    let deltaGameTime = deltaRealTime * lastGameTimeScale;

    this.lastRealTime = currentRealTime;
    this.gameTime += deltaGameTime;
  }

  public getGameTime(): Date {
    /* 没有发生时间速度的改变，所以用当前的游戏速度计算即可 */
    this.modifyGameTime(this.gameTimeScale);
    return new Date(this.gameTime);
  }

  public getGameTimeScale(): number {
    return this.gameTimeScale;
  }

  public setGameTimeScale(scale: number) {
    /* 游戏速度发生改变，用当前未修改的游戏速度计算 */
    this.modifyGameTime(this.gameTimeScale);

    /* 重新计算时间 */
    this.lastGameTimeScale = this.gameTimeScale;
    this.gameTimeScale = scale;

    /* 撤销任务，重新开始 */
    this.tasks = GameTimeService.cancelAndRestartTasks(this.tasks, this.lastGameTimeScale, this.gameTimeScale);
  }

  private static cancelAndRestartTasks(tasks: Task[], lastGameTimeScale: number, currentGameTimeScale: number) {
    /* 取消任务 */
    console.log({tasks});
    let filter: Task[] = [];
    tasks.forEach((e: Task) => {
      e.cancel();
      /* 是否还要继续执行，若不用继续执行则从队列中移除 */
      if (e.hasNextRun()) {
        filter.push(e);
        /* 重新开始 */
        console.log("重新启动");
        e.run(lastGameTimeScale, currentGameTimeScale);
      }
    });
    return filter;
  }

  public registerTaskByTask(task: Task) {
    task.run(this.lastGameTimeScale, this.gameTimeScale);
    this.tasks.push(task);
  }

  public registerTask(task: Function, second: number, repeat: boolean) {
    let modifyTask: Task = new Task(second, () => {
    //   console.log(this.getGameTime());
      task();
    }, repeat);

    this.registerTaskByTask(modifyTask);
    // modifyTask.run(this.lastGameTimeScale, this.gameTimeScale);
    // this.tasks.push(modifyTask);
  }
}
