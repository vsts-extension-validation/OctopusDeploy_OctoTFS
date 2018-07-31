var path = require("path");

var sourceRoot = "source/";
var outputRoot = "dist/";

module.exports = {
    sourceRoot,
    outputPath: outputRoot,
    externals: ["shelljs"]
}