var assert = require('assert');
var fs = require('fs');

describe('Utf8Plumber', function () {
  var helper, plumber;

  beforeEach(function () {
    plumber = require('../src/Utf8Plumber.js');
    helper = require('../src/Utf8PlumberHelper.js');
  });

  it('should contain the same information as it got', function (done) {
    var rs = createBufferStream([new Buffer('abcd')]);
    var ws = plumber();

    rs.pipe(ws)
      .on('readable', function () {
        var data = ws.read();
        assert.equal(data.toString(), 'abcd');
        done();
      });
  });

  it('should be possible to pipe a Readable stream into it', function () {
    var rs = createBufferStream([new Buffer('aaa')]);
    var ws = plumber();

    rs.pipe(ws);
  });

  it('should contain the same information as it got when using files', function (done) {
    var inFileName = __dirname + '/testfile.csv';
    var outFileName = __dirname + '/testfile.out';
    var rs = fs.createReadStream(inFileName);
    var ws = plumber();

    rs.pipe(ws)
      .pipe(fs.createWriteStream(outFileName))
      .on('finish', function () {
        var inFile = fs.readFileSync(inFileName);
        var outFile = fs.readFileSync(outFileName);
        assert.equal(inFile.toString(), outFile.toString());
        done();
      });
  });

  it('should be possible to read only a part of the data', function (done) {
    var rs = createBufferStream([new Buffer('aaa')]);
    var alreadyRead = false;
    var ws = plumber();

    rs.pipe(ws).on('readable', readOneChar);
    function readOneChar() {
      if (!alreadyRead) {
        alreadyRead = true;
        var data = ws.read(1);
        assert.equal(data.toString(), 'a');
        done();
      }
    }
  });

  it('should not split umlaut chars', function (done) {
    var rs = createBufferStream([new Buffer('aää')]);
    var ws = plumber();

    rs.pipe(ws).on('readable', function () {
      var data = ws.read(2);
      assert.equal(data.toString(), 'a');
      data = ws.read(2);
      assert.equal(data.toString(), 'ä');
      done();
    });
  });

  it('should work multiple times in a row', function (done) {
    var buffer = new Buffer('a€aä');
    var rs = createBufferStream([buffer]);
    var ws = plumber();

    rs.pipe(ws).on('readable', function () {
      var data = ws.read(2);
      assert.equal(data.toString(), 'a');
      data = ws.read(3);
      assert.equal(data.toString(), '€');
      data = ws.read(2);
      assert.equal(data.toString(), 'a');
      data = ws.read(1);
      assert.equal(data.toString(), '');
      data = ws.read(2);
      assert.equal(data.toString(), 'ä');
      done();
    });
  });

  it('should result in the correct input if split', function (done) {
    var rs = createBufferStream([new Buffer('aäa')]);
    var ws = plumber();

    rs.pipe(ws).on('readable', function () {
      var data = ws.read(2);
      assert.equal(data.toString(), 'a');
      data = data + ws.read(2);
      assert.equal(data.toString(), 'aä');
      data = data + ws.read(1);
      assert.equal(data.toString(), 'aäa');
      done();
    });
  });

  it('should not get more bytes than expected', function (done) {
    var rs = createBufferStream([new Buffer('äa')]);
    var ws = plumber();

    rs.pipe(ws).on('readable', function () {
      var data = ws.read(1);
      assert.equal(data.toString(), '');
      data = data + ws.read(1);
      assert.equal(data.toString(), '');
      data = data + ws.read(2);
      assert.equal(data.toString(), 'ä');
      data = data + ws.read(1);
      assert.equal(data.toString(), 'äa');
      done();
    });
  });

  it('should work with old style streams', function (done) {
    var rs = createBufferStream([new Buffer('äa')]);
    var ws = plumber();

    rs.pipe(ws).on('data', function (x) {
      assert.equal(x.toString(), 'äa');
    }).on('end', function () {
      done();
    });
  });

  it('should use a problematic file in the next test', function (done) {
    var file = __dirname + '/testfile.csv';
    var rs = fs.createReadStream(file);
    var csv = require('csv');

    rs.pipe(csv.parse()).pipe(csv.stringify())
      .pipe(fs.createWriteStream('tmp-test.csv'))
      .on('finish', function () {
        var resultFromString = fs.readFileSync(file, 'UTF-8');
        var result = fs.readFileSync('tmp-test.csv', 'UTF-8');
        /* There is at least once a strange char sequence ( �� ) inside of the file */
        assert.notEqual(result.length, resultFromString.length);
        assert.notEqual(result, resultFromString);
        assert.equal(true, /��/.test(result));
        done();
      });
  });

  it('should work with a problematic file and a third-party module', function (done) {
    var csv = require('csv');
    var file = __dirname + '/testfile.csv';
    var rs = fs.createReadStream(file);
    var ws = plumber();

    rs.pipe(ws)
      .pipe(csv.parse())
      .pipe(csv.stringify())
      .pipe(fs.createWriteStream('tmp-test.csv'))
      .on('finish', function () {
        var resultFromString = fs.readFileSync(file, 'UTF-8');
        var result = fs.readFileSync('tmp-test.csv', 'UTF-8');
        assert.equal(result.length, resultFromString.length);
        assert.equal(result, resultFromString);
        assert.equal(false, /��/.test(result));
        done();
      });
  });
});


function createBufferStream(buffers) {
  var Stream = require('stream');
  var util = require('util');

  util.inherits(BufferStream, Stream.Readable);

  function BufferStream(opt) {
    Stream.Readable.call(this, opt);
    this.index = 0;
    this.bufferElements = buffers;
  }

  BufferStream.prototype._read = function (size) {
    var i;
    for (i = 0; i < size; i++) {
      if (this.index < this.bufferElements.length) {
        this.push(this.bufferElements[this.index]);
      } else {
        this.push(null);
        return;
      }
      this.index++;
    }
  };

  return new BufferStream(buffers);
}
