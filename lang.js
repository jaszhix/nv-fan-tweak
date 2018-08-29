const rEach = (array, cb, finishCb, i = -1) => {
  i++;
  if (array[i] === undefined) {
    if (typeof finishCb === 'function') finishCb();
    return;
  }
  let next = () => rEach(array, cb, finishCb, i);
  cb(array[i], i, next);
}

module.exports = {rEach};