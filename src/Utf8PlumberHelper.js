function getUnfinishedUtf8CharAtEnd(buffer) {
  var check, i, lastBytes, maxLastBytes;

  maxLastBytes = Math.min(4, buffer.length);

  for (i = maxLastBytes; i > 0;) {
    lastBytes = buffer.slice(buffer.length - i);

    check = checkFirstCharInBufferForUtf8(lastBytes);
    if (check.isUnfinished) {
      return lastBytes;
    } else {
      i = i - check.bytesToDiscard;
    }
  }
  return new Buffer('');
}

function checkFirstCharInBufferForUtf8(buffer) {
  var b = buffer.length + 1;
  var firstBits = buffer[0].toString(2);
  var unnecessaryBits = 8 - b;
  var c = buffer[0] >> unnecessaryBits;
  var cBinary = c.toString(2);
  var isMultiByteChar = firstBits.length === 8 && cBinary[0] === '1';
  var unfinished = /^1+$/.test(cBinary) && isMultiByteChar;
  var bytesToDiscard;

  if (unfinished) {
    bytesToDiscard = buffer.length;
  } else if (isMultiByteChar) {
    bytesToDiscard = cBinary.indexOf('0');
  } else {
    bytesToDiscard = 1;
  }

  return {
    isUnfinished : unfinished,
    bytesToDiscard : bytesToDiscard
  };
}

function numberToByteBinary(num) {
  var b = num.toString(2);

  return addZeros(8 - b.length) + b;

  function addZeros(x) {
    var z = '';
    for (var i = 0; i < x; i++) {
      z += '0';
    }
    return z;
  }
}

function bufferToBinaryString(buffer) {
  var binary = '';

  for (var i = 0; i < buffer.length; i++) {
    binary += numberToByteBinary(buffer[i]) + ' ';
  }

  return binary;
}

module.exports = {
  getUnfinishedUtf8CharAtEnd : getUnfinishedUtf8CharAtEnd,
  checkFirstCharInBufferForUtf8 : checkFirstCharInBufferForUtf8,
  bufferToBinaryString : bufferToBinaryString
};
