export function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  errorMessage = "Request timed out"
): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(new Error(errorMessage));
      }, ms);
    }),
  ]);
}
