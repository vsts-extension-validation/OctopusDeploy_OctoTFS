var gulp = require("gulp");
var path = require("path");
var clean = require("gulp-clean");
var paths = require("../paths");
var glob = require("glob");
var exec = require('child_process').exec;
var debug = require('gulp-debug');
const argv = require('yargs').argv

console.log(path.join(path.resolve(paths.sourceRoot), `tasks/**/*.{json,png,svg,zip,gz}`));
const sourceRoot =  path.resolve(paths.sourceRoot);
const outputPath = path.resolve(paths.outputPath);

gulp.task("build:tasks", () => {
    return exec(`${path.resolve("./node_modules/.bin/webpack")} --mode=development --require ts-node/register --require tsconfig-paths/register`,
    {
        env: {
            TS_NODE_PROJECT: "build/tsconfig-webpack.json",
            EXTENSION_VERSION: argv.extensionVersion
        }
    });
});

gulp.task("build:widget:source", () => {
    return gulp.src(path.join(sourceRoot, `widgets/**/*`), {base: path.join(paths.sourceRoot, `widgets`) })
    .pipe(gulp.dest(path.join(paths.outputPath, `widgets`)));
});

gulp.task("build:widgets", gulp.series(["build:widget:source"]), () =>
{
    return gulp.src("node_modules/vss-web-extension-sdk/lib/**/*.*",{ base: "node_modules/vss-web-extension-sdk" })
    .pipe(gulp.dest(`${paths.outputPath}widgets/ProjectStatus`));
});

gulp.task("build:copy", () => {
    return gulp.src([ path.join(sourceRoot, `*.*`), path.join(sourceRoot, `img/**/*.*`)], { base: sourceRoot })
    .pipe(gulp.dest(outputPath));
});

gulp.task("build:copy:task:content", gulp.series(["build:tasks"]), () => {
    return gulp.src(path.join(path.resolve(paths.sourceRoot), `tasks/**/*.{json,png,svg,zip,gz}`), { base: path.resolve(paths.sourceRoot)})
    .pipe(debug({title: "Copy Task Content"})).pipe(gulp.dest(paths.outputPath));
});


gulp.task("build:copy:task:content2", gulp.parallel(["build:copy"]), () => {
    return gulp.src(path.join(path.resolve(paths.sourceRoot), `tasks/**/*.{json,png,svg,zip,gz}`), { base: path.resolve(paths.sourceRoot)})
    .pipe(debug({title: "Copy Task Content"}))
    .pipe(gulp.dest(paths.outputPath));
});

gulp.task("build:copy:externals", gulp.series(["build:tasks"]), (cb) => {
    var stream = gulp.src(paths.externals.map(x => `node_modules/${x}/**/*.*`), { base: "."});

    glob(`${paths.outputPath}/tasks/**/task.json`, (err, matches) => {
        if(err){
            cb(err);
            return;
        }
        console.log("Matches : " + matches.length);

        matches.forEach((task) => {
            var dir = path.basename(task);
            console.log(dir);
            stream = stream.pipe(gulp.dest(path.dirname(task)));
        })

        stream.on("end", cb);
    });

    return stream;
});

gulp.task("clean", () => {
    return gulp.src("dist", {read: false, allowEmpty: true})
    .pipe(clean());
});

gulp.task("build",
    gulp.series(
        "clean",
        "build:tasks",
        "build:widgets",
        "build:copy",
        "build:copy:task:content"
    )
);
