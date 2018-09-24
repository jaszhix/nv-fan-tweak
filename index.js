const exc = require('./exc.js');
const pkgJson = require('./package.json');
const {fanCurves, interval} = require('./config.json');
const {rEach} = require('./lang.js');

process.title = pkgJson.name;

let timeout, GPUs = [];

const convertRange = (value, r1, r2) => {
  return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
};

const getFanSpeed = (args) => {
  let [tempString, fanIndex] = args;
  let fanCurve = fanCurves[fanIndex];
  if (!fanCurve) throw new Error('getFanSpeed: Invalid GPU index.');
  let temp = tempString.match(/(\d)+/g);
  if (!temp) throw new Error('Didn\'t receive a temperature value from nvidia-smi.');
  temp = parseInt(temp[0]);

  let range;
  let len = fanCurve.length
  let firstNotch = fanCurve[0];
  let lastNotch = fanCurve[len - 1];

  for (let i = 0; i < len; i++) {
    let notch = fanCurve[i];
    let prevNotch = fanCurve[i - 1];
    let nextNotch = fanCurve[i + 1];

    if (!prevNotch) prevNotch = Object.assign({}, {end: true}, fanCurve[0]);
    if (!nextNotch) nextNotch = Object.assign({}, {end: true}, fanCurve[len - 1]);

    if (temp <= firstNotch.temp) return [firstNotch.fanSpeed, fanIndex];
    if (temp >= lastNotch.temp) return [lastNotch.fanSpeed, fanIndex];
    if (temp <= notch.temp && (temp >= prevNotch.temp)) {
      range = [[prevNotch.temp, notch.temp], [prevNotch.fanSpeed, notch.fanSpeed]];
    } else if (temp > notch.temp && (temp <= nextNotch.temp)) {
      range = [[notch.temp, nextNotch.temp], [notch.fanSpeed, nextNotch.fanSpeed]];
    }
    if (range) break;
  }

  let fanSpeed = convertRange(temp, ...range);
  if (fanSpeed < 0) {
    fanSpeed = 0;
  } else if (fanSpeed > 100) {
    fanSpeed = 100;
  }
  return [fanSpeed, fanIndex];
};

const setFanSpeed = (args) => {
  let [fanSpeed, fanIndex] = args;
  return exc(`nvidia-settings -a [fan:${fanIndex}]/GPUTargetFanSpeed=${fanSpeed}`);
};

const getTemp = (fanIndex, gpuIndex) => {
  return new Promise((resolve, reject) => {
    exc(`nvidia-smi -q --gpu=${gpuIndex} | grep "GPU Current Temp"`).then((tempString) => {
      resolve([tempString, fanIndex]);
    }).catch((err) => reject(err))
  });
};

const checkTemp = () => {
  rEach(fanCurves, (fanCurve, i, next) => {
    getTemp(i, fanCurve.gpuIndex)
      .then(getFanSpeed)
      .then(setFanSpeed)
      .then(next)
      .catch((err) => console.log(err));
  }, () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(checkTemp, interval);
  });
};

const parseSMI = (gpuIndex) => {
  return new Promise((resolve, reject) => {
    exc(`nvidia-smi -q --gpu=${gpuIndex}`).then((tempString) => {
      let lines = tempString.split('\n').filter((line) => line.includes(':'));
      for (let i = 0; i < lines.length; i++) {
        let [key, value] = lines[i].split(':');
        if (key.trim() === 'Display Mode' && value.trim() === 'Disabled') {
          return reject(`GPU ${gpuIndex} is disabled.`);
        }
      }
      resolve(gpuIndex);
    }).catch((err) => reject(err))
  });
};

const init = () => {
  rEach(fanCurves, (fanCurve, i, next) => {
    parseSMI(i)
      .then((gpuIndex) => GPUs.push(gpuIndex))
      .then(next)
      .catch((err) => {
        console.log(err);
        next();
      });
  }, () => {
    while (fanCurves.length < GPUs.length) {
      fanCurves.push(fanCurves[fanCurves.length - 1]);
    }
    while (fanCurves.length > GPUs.length) {
      fanCurves.splice(-1);
    }
    for (let i = 0; i < fanCurves.length; i++) {
      fanCurves[i].gpuIndex = GPUs[i];
    }
    if (!process.env.NVFT_TEST) checkTemp();
  });
};

init();

module.exports = {getFanSpeed};