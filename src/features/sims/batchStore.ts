/** The chunk-size slider in the batch simulator also rewrites the Step definition code further down the page. */
let size = 3;
const subs = new Set<() => void>();
export const getBatchSize = () => size;
export const subscribeBatchSize = (fn: () => void) => {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
};
export function setBatchSize(n: number) {
  if (n === size) return;
  size = n;
  subs.forEach((f) => f());
}
