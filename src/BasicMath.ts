export class BasicMath {
  public static solve(left: number, right: number, lambda: Function) {
    let delta = right - left;/* 区间 */
    let precision = 0.005;
    let time = Math.log2(delta / precision);
    let ans = 0;
    while (true) {
      let mid = (right + left) * 0.5;
      if (lambda(mid) >= 0) left = mid;
      else right = mid;
      ans = mid;
      if (Math.abs(right - left) < precision) break;
    }
    return (right + left) * 0.5;
  }
}
