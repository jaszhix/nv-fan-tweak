# nv-fan-tweak

This is a simple Node script that is intended to run in the background and control the fan speed based on a curve. The fan curve and interval is configured by editing config.json.

# Usage

Enable fan control in nvidia-settings (requires X server restart).

```
sudo nvidia-xconfig --cool-bits=4
```

Install globally with npm.

```sh
npm pack . && npm install -g nv-fan-tweak-1.0.0.tgz
nv-fan-tweak
```