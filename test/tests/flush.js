/* @flow */

import { ZalgoPromise } from "../../src";

describe("flush cases", () => {
  it("should call flush after every other synchronous task completed", () => {
    return ZalgoPromise.try(() => {
      let count = 0;
      const tasks = [];

      tasks.push(
        ZalgoPromise.flush().then(() => {
          if (count !== 6) {
            throw new Error(`Expected count to be 6, got ${count}`);
          }
        })
      );

      tasks.push(
        ZalgoPromise.try(() => {
          count += 1;
        })
      );

      tasks.push(
        ZalgoPromise.try(() => {
          count += 2;
        })
      );

      tasks.push(
        ZalgoPromise.try(() => {
          count += 3;
        })
      );

      return ZalgoPromise.all(tasks);
    });
  });
});
