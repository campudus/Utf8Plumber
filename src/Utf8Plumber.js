var helper = require('./Utf8PlumberHelper.js');

function utf8Plumber(opt) {
  var Stream = require('stream');
  var util = require('util');

  util.inherits(Utf8Plumber, Stream.Transform);

  function Utf8Plumber(opt) {
    var options = opt || {debug : false};
    Stream.Transform.call(this, options);
    this.remainingBytes = null;
    this.debug = (!!options.debug);
  }

  Utf8Plumber.prototype._transform = function (chunk, encoding, next) {
    if (this.debug) {
      console.log('_transform()!');
    }
    var startOfUnfinishedUtf8BytesIndex;
    var dataToUse;
    if (this.remainingBytes !== null) {
      dataToUse = Buffer.concat([this.remainingBytes, chunk]);
      this.remainingBytes = null;
    } else {
      dataToUse = chunk;
    }
    var unfinishedUtf8Bytes = helper.getUnfinishedUtf8CharAtEnd(dataToUse);
    if (unfinishedUtf8Bytes.length > 0) {
      startOfUnfinishedUtf8BytesIndex = dataToUse.length - unfinishedUtf8Bytes.length;
      this.push(dataToUse.slice(0, startOfUnfinishedUtf8BytesIndex));
      this.remainingBytes = dataToUse.slice(startOfUnfinishedUtf8BytesIndex);
    } else {
      this.push(dataToUse);
    }
    next();
  };

  Utf8Plumber.prototype.read = function (size) {
    if (this.debug) {
      console.log('should read() ' + size);
    }
    var data = Stream.Transform.prototype.read.call(this, size);
    var toPush = readToPush(this, data, size);
    if (this.debug) {
      console.log('to push in read()=', toPush);
    }

    return toPush;
  };

  return new Utf8Plumber(opt);

  function readToPush(that, byteBuffer, size) {
    var dataToUse, dataInNext, unfinishedUtf8Bytes, startOfUnfinishedUtf8BytesIndex;

    if (byteBuffer === null) {
      return null;
    } else {
      if (size < byteBuffer.length) {
        dataToUse = byteBuffer.slice(0, size);
        dataInNext = byteBuffer.slice(size);
        unfinishedUtf8Bytes = helper.getUnfinishedUtf8CharAtEnd(dataToUse);
        if (unfinishedUtf8Bytes.length > 0) {
          startOfUnfinishedUtf8BytesIndex = dataToUse.length - unfinishedUtf8Bytes.length;
          dataInNext = Buffer.concat([dataToUse.slice(startOfUnfinishedUtf8BytesIndex), dataInNext]);
          dataToUse = dataToUse.slice(0, startOfUnfinishedUtf8BytesIndex);
        }
        that.unshift(dataInNext);
        return dataToUse;
      } else {
        dataToUse = byteBuffer;
        unfinishedUtf8Bytes = helper.getUnfinishedUtf8CharAtEnd(dataToUse);
        if (unfinishedUtf8Bytes.length > 0) {
          startOfUnfinishedUtf8BytesIndex = dataToUse.length - unfinishedUtf8Bytes.length;
          dataInNext = dataToUse.slice(startOfUnfinishedUtf8BytesIndex);
          dataToUse = dataToUse.slice(0, startOfUnfinishedUtf8BytesIndex);
          that.unshift(dataInNext);
        }
        return dataToUse;
      }
    }
  }
}

module.exports = utf8Plumber;
