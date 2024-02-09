let ReferencePrefix = "`";
let ReferencePrefixCode = ReferencePrefix.charCodeAt(0);
let ReferenceIntBase = 96;
let ReferenceIntFloorCode = " ".charCodeAt(0);
let ReferenceIntCeilCode = ReferenceIntFloorCode + ReferenceIntBase - 1;
let MaxStringDistance = Math.pow(ReferenceIntBase, 2) - 1;
let MinStringLength = 5;
let MaxStringLength = Math.pow(ReferenceIntBase, 1) - 1 + MinStringLength;
let MaxWindowLength = MaxStringDistance + MinStringLength;

function encodeReferenceInt(value, width) {
  if (value >= 0 && value < Math.pow(ReferenceIntBase, width) - 1) {
    var encoded = "";
    while (value > 0) {
      encoded = String.fromCharCode((value % ReferenceIntBase) + ReferenceIntFloorCode) + encoded;
      value = Math.floor(value / ReferenceIntBase);
    }

    var missingLength = width - encoded.length;
    for (var i = 0; i < missingLength; i++) {
      encoded = String.fromCharCode(ReferenceIntFloorCode) + encoded;
    }

    return encoded;
  } else {
    throw "Referencia fuera de rango: " + value + " (tamaño = " + width + ")";
  }
}

function encodeReferenceLength(length) {
  return encodeReferenceInt(length - MinStringLength, 1);
}

function decodeReferenceInt(data, width) {
  var value = 0;
  for (var i = 0; i < width; i++) {
    value *= ReferenceIntBase;
    var charCode = data.charCodeAt(i);
    if (charCode >= ReferenceIntFloorCode && charCode <= ReferenceIntCeilCode) {
      value += charCode - ReferenceIntFloorCode;
    } else {
      throw "Código de carácter inválido en referencia entera: " + charCode;
    }
  }
  return value;
}

function decodeReferenceLength(data) {
  return decodeReferenceInt(data, 1) + MinStringLength;
}

function compress(data, windowLength) {
  if (windowLength > MaxWindowLength) {
    throw "El tamaño de diccionario no puede ser mayor a 9220";
  }

  var compressed = "";
  var pos = 0;
  var lastPos = data.length - MinStringLength;
  while (pos < lastPos) {
    var searchStart = Math.max(pos - windowLength, 0);
    var matchLength = MinStringLength;
    var foundMatch = false;
    var bestMatch = { distance: MaxStringDistance, length: 0 };
    var newCompressed = null;

    while (searchStart + matchLength < pos) {
      var isValidMatch = data.substr(searchStart, matchLength) == data.substr(pos, matchLength) && matchLength < MaxStringLength;
      if (isValidMatch) {
        matchLength++;
        foundMatch = true;
      } else {
        var realMatchLength = matchLength - 1;
        if (foundMatch && realMatchLength > bestMatch.length) {
          bestMatch.distance = pos - searchStart - realMatchLength;
          bestMatch.length = realMatchLength;
        }
        matchLength = MinStringLength;
        searchStart++;
        foundMatch = false;
      }
    }

    if (bestMatch.length) {
      newCompressed = ReferencePrefix + encodeReferenceInt(bestMatch.distance, 2) + encodeReferenceLength(bestMatch.length);
      pos += bestMatch.length;
    } else {
      if (data.charAt(pos) != ReferencePrefix) {
        newCompressed = data.charAt(pos);
      } else {
        newCompressed = ReferencePrefix + ReferencePrefix;
      }
      pos++;
    }

    compressed += newCompressed;
  }
  return compressed + data.slice(pos).replace(/`/g, "``");
}

function decompress(data) {
  var decompressed = "";
  var pos = 0;
  while (pos < data.length) {
    var currentChar = data.charAt(pos);
    if (currentChar != ReferencePrefix) {
      if (currentChar == "\\") {
        var nextChar = data.charAt(pos + 1);
        if (nextChar == "n") {
          decompressed += "\n";
          pos += 2;
          continue;
        }
      }
      decompressed += currentChar;
      pos++;
    } else {
      var nextChar = data.charAt(pos + 1);
      if (nextChar != ReferencePrefix) {
        var distance = decodeReferenceInt(data.substr(pos + 1, 2), 2);
        var length = decodeReferenceLength(data.charAt(pos + 3));
        decompressed += decompressed.substr(decompressed.length - distance - length, length);
        pos += MinStringLength - 1;
      } else {
        decompressed += ReferencePrefix;
        pos += 2;
      }
    }
  }
  return decompressed;
}

function showProgressModal() {
  document.getElementById("progressModal").style.display = "block";
}
function hideProgressModal() {
  document.getElementById("progressModal").style.display = "none";
}

function updateProgressBar(progress) {
  document.getElementById("progress").style.width = progress + "%";
  document.getElementById("progress").innerHTML = progress + "%";
}

function updateCharacterCount(textAreaId, charCountSpanId, sizeKBSpanId, otherTextAreaId, otherCharCountSpanId, otherSizeKBSpanId) {
  let text = document.getElementById(textAreaId).value;
  document.getElementById(charCountSpanId).textContent = text.length.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  document.getElementById(sizeKBSpanId).textContent = (text.length / 1024).toFixed(2) + " KB";

  let otherText = document.getElementById(otherTextAreaId).value;
  document.getElementById(otherCharCountSpanId).textContent = otherText.length.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  document.getElementById(otherSizeKBSpanId).textContent = (otherText.length / 1024).toFixed(2) + " KB";

  let valorizacion = document.getElementById("inputText").value;
  valorizacion = (valorizacion.length * 100) / 100;
  if (valorizacion > 9220) {
    document.getElementById("dictionarySize").value = 9220;
  } else if (valorizacion < 4610) {
    document.getElementById("dictionarySize").value = valorizacion.toFixed(0) * 2;
  } else if (valorizacion < 3072) {
    document.getElementById("dictionarySize").value = valorizacion.toFixed(0) * 3;
  } else if (valorizacion < 2304) {
    document.getElementById("dictionarySize").value = valorizacion.toFixed(0) * 4;
  } else if (valorizacion < 1536) {
    document.getElementById("dictionarySize").value = valorizacion.toFixed(0) * 6;
  } else if (valorizacion < 768) {
    document.getElementById("dictionarySize").value = valorizacion.toFixed(0) * 12;
  } else if (valorizacion < 384) {
    document.getElementById("dictionarySize").value = valorizacion.toFixed(0) * 24;
  } else if (valorizacion < 192) {
    document.getElementById("dictionarySize").value = valorizacion.toFixed(0) * 48;
  } else if (valorizacion < 96) {
    document.getElementById("dictionarySize").value = valorizacion.toFixed(0) * 96;
  } else if (valorizacion < 48) {
    document.getElementById("dictionarySize").value = valorizacion.toFixed(0) * 192;
  }
}

function clearTextArea() {
  document.getElementById("outputText").value = "";
  document.getElementById("stats").innerHTML = "";
}

function compressText() {
  clearTextArea();
  let inputText = document.getElementById("inputText").value;
  let dictionarySize = parseInt(document.getElementById("dictionarySize").value);
  showProgressModal();
  let startTime = performance.now();
  let compressedText = "";
  let originalSize = inputText.length;
  let resultSize = 0;
  let compressionRatio = 0;

  let progress = 0;

  function compressBlockWithDelay(index) {
    try {
      let block = inputText.substr(index, dictionarySize);
      let compressedBlock = compress(block, dictionarySize);
      compressedText += compressedBlock;

      resultSize += compressedBlock.length;

      compressionRatio = ((originalSize - resultSize) / originalSize) * 100;

      progress = ((index + dictionarySize) / originalSize) * 100;
      updateProgressBar(progress.toFixed(2));

      if (index + dictionarySize < originalSize) {
        setTimeout(function () {
          compressBlockWithDelay(index + dictionarySize);
        }, 0);
      } else {
        let endTime = performance.now();
        let elapsedTime = (endTime - startTime) / 1000;

        let statsMessage = `(Ratio de compresión de ${compressionRatio.toFixed(2)}%);<br /><br />Comprimido en ${elapsedTime.toFixed(1)} segundos<br/>(${(
          originalSize / elapsedTime
        )
          .toFixed(0)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")} caracteres/segundo)<br/>Con un tamaño de diccionario de ${dictionarySize}.`;

        document.getElementById("outputText").value = compressedText.replace(/\n/g, "\\n");
        document.getElementById("stats").innerHTML = statsMessage;
        hideProgressModal();

        updateCharacterCount("outputText", "charCountOutput", "sizeKBOutput", "inputText", "charCountInput", "sizeKBInput");
      }
    } catch (error) {
      hideProgressModal();
      alert("Error durante la compresión: " + error);
      clearTextArea();
    }
  }

  compressBlockWithDelay(0);
}

function decompressText() {
  clearTextArea();
  let inputText = document.getElementById("inputText").value;
  showProgressModal();
  let startTime = performance.now();
  let originalSize = inputText.length;
  let resultSize = 0;

  function updateProgressBar(progress) {
    document.getElementById("progress").style.width = progress + "%";
    document.getElementById("progress").innerHTML = progress + "%";
  }

  function decompressBlockWithDelay(index) {
    try {
      let block = inputText.substr(index, originalSize - index);
      let decompressedBlock = decompress(block);
      resultSize += decompressedBlock.length;

      let progress = (resultSize / originalSize) * 100;
      updateProgressBar(progress.toFixed(2));

      document.getElementById("outputText").value += decompressedBlock;

      if (index + block.length < originalSize) {
        setTimeout(function () {
          decompressBlockWithDelay(index + block.length);
        }, 0);
      } else {
        let endTime = performance.now();
        let elapsedTime = (endTime - startTime) / 1000;

        let statsMessage = `Descomprimido en ${elapsedTime.toFixed(1)} segundos (${(originalSize / elapsedTime)
          .toFixed(2)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")} caracteres/segundo).`;

        document.getElementById("stats").innerHTML = statsMessage;
        hideProgressModal();

        updateCharacterCount("outputText", "charCountOutput", "sizeKBOutput", "inputText", "charCountInput", "sizeKBInput");
      }
    } catch (error) {
      hideProgressModal();
      alert("Error durante la descompresión: " + error);
      clearTextArea();
    }
  }
  decompressBlockWithDelay(0);
}

function textoPrueba() {
  document.getElementById("inputText").value = textoLorem;
  updateCharacterCount("inputText", "charCountInput", "sizeKBInput", "outputText", "charCountOutput", "sizeKBOutput");
  const valor = (document.getElementById("dictionarySize").value = (textoLorem.length * 100) / 100);
  if (valor > 9220) {
    document.getElementById("dictionarySize").value = 9220;
  } else if (valor < 4610) {
    document.getElementById("dictionarySize").value = valor.toFixed(0) * 2;
  } else if (valor < 3072) {
    document.getElementById("dictionarySize").value = valor.toFixed(0) * 3;
  } else if (valor < 2304) {
    document.getElementById("dictionarySize").value = valor.toFixed(0) * 4;
  } else if (valor < 1536) {
    document.getElementById("dictionarySize").value = valor.toFixed(0) * 6;
  } else if (valor < 768) {
    document.getElementById("dictionarySize").value = valor.toFixed(0) * 12;
  } else if (valor < 384) {
    document.getElementById("dictionarySize").value = valor.toFixed(0) * 24;
  } else if (valor < 192) {
    document.getElementById("dictionarySize").value = valor.toFixed(0) * 48;
  } else if (valor < 96) {
    document.getElementById("dictionarySize").value = valor.toFixed(0) * 96;
  } else if (valor < 48) {
    document.getElementById("dictionarySize").value = valor.toFixed(0) * 192;
  }
}

function borrarTextoInput() {
  document.getElementById("inputText").value = "";
  updateCharacterCount("inputText", "charCountInput", "sizeKBInput", "outputText", "charCountOutput", "sizeKBOutput");
}
