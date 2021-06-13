import { FireCar } from './FireCar';

export interface FireCarScheduleInterface{
    inFireCars(fireCars: FireCar[]): void;
    outFireCars(fireCars: FireCar[]): FireCar[];
}