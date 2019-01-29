var gulp = require("gulp");
var path = require("path");
var clean = require("gulp-clean");
var paths = require("../paths");
var glob = require("glob");
var cp = require('child_process');
const argv = require('yargs').argv



gulp.task("build:tasks", () => {
    return cp.exec("./node_modules/.bin/webpack --mode=development --require ts-node/register --require tsconfig-paths/register",
    {
        env: {
            TS_NODE_PROJECT: "build/tsconfig-webpack.json",
            EXTENSION_VERSION: argv.extensionVersion
        }
    });
});

gulp.task("build:widget:source", () => {
    return gulp.src(`${paths.sourceRoot}widgets/**/*`, {base: `${paths.sourceRoot}widgets`})
    .pipe(gulp.dest(`${paths.outputPath}widgets`));
});

gulp.task("build:widgets", gulp.series(["build:widget:source"]), () =>
{
    return gulp.src("node_modules/vss-web-extension-sdk/lib/**/*.*",{ base: "node_modules/vss-web-extension-sdk" })
    .pipe(gulp.dest(`${paths.outputPath}widgets/ProjectStatus`));
});

gulp.task("build:copy", () => {
    return gulp.src([`${paths.sourceRoot}*.*`, `${paths.sourceRoot}img/**/*.*`], { base: `${paths.sourceRoot}`})
    .pipe(gulp.dest("dist"));
});

gulp.task("build:copy:task:content", gulp.series(["build:tasks"]), (cb) => {
    var stream = gulp.src(`${paths.sourceRoot}tasks/**/*.{json,png,svg,zip,gz}`, { base: paths.sourceRoot}).pipe(gulp.dest(paths.outputPath));
    return stream;
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
        gulp.parallel(
            "build:tasks",
            "build:widgets",
            "build:copy",
            "build:copy:task:content"
        )
    )
);
