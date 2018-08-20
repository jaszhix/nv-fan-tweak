const exc = require('./exc.js');
const pkgJson = require('./package.json');
const config = require('./config.json');

process.title = pkgJson.name;

const {fanCurve, interval} = config;
let timeout;

const convertRange = (value, r1, r2) => {
  return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
};

const getFanSpeed = (tempString) => {
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

    if (temp <= firstNotch.temp) return firstNotch.fanSpeed;
    if (temp >= lastNotch.temp) return lastNotch.fanSpeed;
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
  return fanSpeed;
};

const setFanSpeed = (fanSpeed) => {
  return exc(`nvidia-settings -a [fan:0]/GPUTargetFanSpeed=${fanSpeed}`);
};

const checkTemp = () => {
  exc('nvidia-smi -q --gpu=1 | grep "GPU Current Temp"')
    .then(getFanSpeed)
    .then(setFanSpeed)
    .then(() => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(checkTemp, interval);
    })
    .catch((err) => console.log(err));
};

if (!process.env.NVFT_TEST) checkTemp();

module.exports = {getFanSpeed};