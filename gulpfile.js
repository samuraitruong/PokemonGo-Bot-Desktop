const gulp = require('gulp');
const async = require('async');
const fs = require('fs');
const rimraf = require('rimraf');
const zip = require('gulp-zip');
const util = require('gulp-util');
const electron = require('gulp-atom-electron');
const symdest = require('gulp-symdest');
const exec = require('child_process').exec;

const BUILD_DIR = 'build';
const PACKAGES = `${BUILD_DIR}/packages`;

gulp.task('python:install', callback => {
    async.waterfall([
        cb => rimraf(PACKAGES, cb),
        cb => async.concat(fs.readFileSync('gofbot/requirements.txt')
            .toString()
            .split('\n')
            .map(dep => dep.trim().replace('-e ', '')), (cmd, _) => exec(`pip install ${cmd} --target ${PACKAGES}`, _), err => cb(err)),
        cb => fs.open(`${PACKAGES}/google/__init__.py`, 'wx', cb),
        (file, cb) => fs.close(file, cb)
    ], callback);
});

gulp.task('python:package', ['python:install'], () => {
    return gulp.src(`${PACKAGES}/**/!(*.pyc|*.egg-info)`)
        .pipe(zip('packages.zip'))
        .pipe(gulp.dest('build'))
});

gulp.task('electron:osx', ['python:package'], () => {
    return gulp.src(['app/**', 'LICENSE', 'gofbot/**/*', 'package.json', 'main.js'])
        .pipe(electron({
            version: '1.3.3',
            platform: 'darwin',
            darwinIcon: 'resources/image/icons/pokemon.icns',
            darwinBundleIdentifier: 'com.github.pokemongof'
        })).pipe(symdest('build/app'));
});

gulp.task('electron:windows', ['python:package'], () => {
    return gulp.src(['app/**', 'LICENSE', 'gofbot/**/*', 'package.json', 'main.js', 'pywin/**/*'])
        .pipe(electron({
            version: '1.3.3',
            platform: 'win32',
            arch: 'ia32',
            winIcon: 'resources/image/icons/pokemon.ico',
            companyName: 'PokemonGoF',
            copyright: '2016 PokemonGOF, All Rights Reserved.'
        }))
        .pipe(zip('app-windows.zip'))
        .pipe(gulp.dest('build/'));
});

gulp.task('build', ['python:package', 'electron:osx', 'electron:windows']);