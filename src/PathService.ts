import { Path, Route } from './Entity/Path';
import { GameTimeService } from './GameTimeService';

export class PathService{
    private pathList: Path[];

    constructor(
        private gameTimeService: GameTimeService
    ){
        this.pathList = [];
    }

    public registerPath(path: Path){
        this.pathList.push(path);

        /* 运行这条路径 */
        path.start(this.gameTimeService.getGameTime().getTime());
    }

}