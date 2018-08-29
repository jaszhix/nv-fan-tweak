const test = require('tape');
const {getFanSpeed}  = require('../index.js');

test('should return 40% at 40C with defaults', function (t) {
  t.equal(getFanSpeed(['40', 0]), 40);
  t.end();
});

test('should return 56% at 48C with defaults', function (t) {
  t.equal(getFanSpeed(['48', 0]), 56);
  t.end();
});

test('should return 60% at 50C with defaults', function (t) {
  t.equal(getFanSpeed(['50', 0]), 60);
  t.end();
});

test('should return 64% at 52C with defaults', function (t) {
  t.equal(getFanSpeed(['52', 0]), 64);
  t.end();
});

test('should return 68% at 54C with defaults', function (t) {
  t.equal(getFanSpeed(['54', 0]), 68);
  t.end();
});

test('should return 72% at 56C with defaults', function (t) {
  t.equal(getFanSpeed(['56', 0]), 72);
  t.end();
});

test('should return 76% at 58C with defaults', function (t) {
  t.equal(getFanSpeed(['58', 0]), 76);
  t.end();
});

test('should return 80% at 60C with defaults', function (t) {
  t.equal(getFanSpeed(['60', 0]), 80);
  t.end();
});

test('should not go below the lowest fan speed threshold', function (t) {
  t.equal(getFanSpeed(['20', 0]), 40);
  t.end();
});

test('should not go above the highest fan speed threshold', function (t) {
  t.equal(getFanSpeed(['90', 0]), 80);
  t.end();
});

test('should not go above 100%', function (t) {
  t.equal(getFanSpeed(['200', 0]), 80);
  t.end();
});

test('should not go below 0%', function (t) {
  t.equal(getFanSpeed(['-3', 0]), 40);
  t.end();
});

test('should throw error if regex doesn\'t match', function (t) {
  t.throws(() => getFanSpeed(['abc', 0]), new Error('Didn\'t receive a temperature value from nvidia-smi.'));
  t.end();
});

test('should throw error if gpu doesn\'t exist in configuration', function (t) {
  t.throws(() => getFanSpeed(['82', 1]), new Error('getFanSpeed: Invalid GPU index.'));
  t.end();
});