const {exec} = require('child_process');

const exc = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(stdout.trim());
    });
  });
};

module.exports = exc;