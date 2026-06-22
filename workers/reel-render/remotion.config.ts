// Remotion CLI config (studio + `remotion render`). See https://remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.overrideWebpackConfig((config) => config);
