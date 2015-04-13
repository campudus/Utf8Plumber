var assert = require('assert');

describe('checkFirstCharInBufferForUtf8', function () {
  var helper = require('../src/Utf8PlumberHelper.js');

  it('should return no unfinished bytes for a single byte char', function () {
    var input = 'a';
    var singleByteFalse = new Buffer(input).slice(0, 1);
    assert.equal(false, helper.checkFirstCharInBufferForUtf8(singleByteFalse).isUnfinished);
    assert.equal(1, helper.checkFirstCharInBufferForUtf8(singleByteFalse).bytesToDiscard);
  });

  it('should return no unfinished bytes for first char, even if second char is split', function () {
    var input = 'aä';
    var singleByteFalse = new Buffer(input).slice(0, 2);
    assert.equal(false, helper.checkFirstCharInBufferForUtf8(singleByteFalse).isUnfinished);
    assert.equal(1, helper.checkFirstCharInBufferForUtf8(singleByteFalse).bytesToDiscard);
  });

  it('should return one unfinished byte for a splitted umlaut char', function () {
    var input = 'ä';
    var singleByteTrue = new Buffer(input).slice(0, 1);
    assert.equal(true, helper.checkFirstCharInBufferForUtf8(singleByteTrue).isUnfinished);
    assert.equal(1, helper.checkFirstCharInBufferForUtf8(singleByteTrue).bytesToDiscard);
  });

  it('should discard two bytes when reading over an umlaut char', function () {
    var input = 'ä';
    var twoBytesFalse = new Buffer(input).slice(0, 2);
    assert.equal(false, helper.checkFirstCharInBufferForUtf8(twoBytesFalse).isUnfinished);
    assert.equal(2, helper.checkFirstCharInBufferForUtf8(twoBytesFalse).bytesToDiscard);
  });

  it('should only look at the first byte and don\'t care about the remaining bytes', function () {
    var input = '€ä';
    var multiByteFalse = new Buffer(input).slice(0, 4);
    assert.equal(false, helper.checkFirstCharInBufferForUtf8(multiByteFalse).isUnfinished);
    assert.equal(3, helper.checkFirstCharInBufferForUtf8(multiByteFalse).bytesToDiscard);
  });

});

describe('getUnfinishedUtf8CharAtEnd', function () {
  var helper = require('../src/Utf8PlumberHelper.js');

  it('should return zero when called with a good value', function () {
    var singleByteFalse = new Buffer('aa').slice(0, 1);
    assert.equal(0, helper.getUnfinishedUtf8CharAtEnd(singleByteFalse).length);
  });

  it('should return one when broken inside an umlaut', function () {
    var singleByteTrue = new Buffer('ä').slice(0, 1);
    assert.equal(1, helper.getUnfinishedUtf8CharAtEnd(singleByteTrue).length);
  });

  it('should return one when broken inside an umlaut', function () {
    var singleByteTrue = new Buffer('ää').slice(0, 3);
    assert.equal(1, helper.getUnfinishedUtf8CharAtEnd(singleByteTrue).length);
  });

  it('should return one when broken after first character in a euro-symbol', function () {
    var twoBytes = new Buffer('€').slice(0, 1);
    assert.equal(1, helper.getUnfinishedUtf8CharAtEnd(twoBytes).length);
  });

  it('should return zero with full euro-symbol', function () {
    var zeroBytes = new Buffer('€');
    assert.equal(0, helper.getUnfinishedUtf8CharAtEnd(zeroBytes).length);
  });

  it('should return two when broken inside a euro-symbol', function () {
    var twoBytes = new Buffer('€').slice(0, 2);
    assert.equal(2, helper.getUnfinishedUtf8CharAtEnd(twoBytes).length);
  });

});
