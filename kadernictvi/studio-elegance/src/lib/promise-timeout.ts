/** Omezí čekání na síťové volání — zabrání „věčnému“ načítání při blokaci / špatné konfiguraci. */
export function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(`${label}: vypršel čas (${Math.round(ms / 1000)} s).`));
    }, ms);
    Promise.resolve(promise).then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}
