const assert = require('assert'),
    argv = require('minimist')(process.argv.slice(2)),
    fs = require('fs'),
    path = require('path'),
    {VERSIONS, getVersion} = require('./bin/versions'),
    removeFileExt = require('./bin/helpers.js'),
    writeOutput = (path, src) => {
        fs.writeFileSync(path, src);
        console.log('writing ' + path);
    }
;

if (!argv._.length || argv.h || argv.help) {
    //show man page
    console.log(require('./bin/help'));
    process.exit(0)
}

assert(argv._.length <= 2, 'too many arguments');

const input = path.resolve(argv._[0]);  //use input path from arguments
assert.ok(input, 'missing mandatory argument "input"'); //throw when missing input
assert.doesNotThrow(() => fs.existsSync(input), `couldn't locate input file under ${input}`);

const output = argv._[1]; //use output from arguments
if (output) {
    assert.doesNotThrow(() => fs.existsSync(output), `couldn't locate output file under ${output}`);
}

const watch = argv.w || argv.watch;
const template = argv.t || argv.template;

//read from input path
const fileInputPath = path.resolve(input);
console.log('reading ' + fileInputPath);

//inject input to inject path
const fileInjectPath = !!output ? path.resolve(output): getVersion(template); //use specified file from output argument or template

//output the result to output path
const fileOutputPath = output ? path.resolve(output) : fileInputPath + '.p8'; //create a new file when not specified the output
console.log(`using ${fileOutputPath} as output`);


const luaSource = fs.readFileSync(fileInputPath, 'utf8'); //contents of input file
const picoSource = fs.readFileSync(fileInjectPath, 'utf8'); //contents of output file

const src = [
    picoSource.slice(0, picoSource.indexOf('__lua__') + 7),
    luaSource,
    picoSource.slice(picoSource.indexOf('__gfx__')),
].join('\n');

if (watch) {
    console.log('watching for file changes on ' + fileInputPath);
    fs.watch(fileInputPath, {encoding: 'buffer'}, (eventType, filename) => {
        if (filename && eventType === 'change') {
            console.log("changes detected on " + filename.toString())
            writeOutput(fileOutputPath, src);
        }
    });
}
else {
    writeOutput(fileOutputPath, src);
    console.log('done');
    process.exit(0)
}