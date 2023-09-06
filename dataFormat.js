/* eslint-disable no-unused-vars */
import { Buffer } from "buffer";
import PropTypes from "prop-types";

export function getToday() {
  return Math.floor(new Date().getTime() / 1000);
}

export function convert2datetime({ years, months, days }) {
  if (years == undefined) years = 0;
  if (months == undefined) months = 0;
  if (days == undefined) days = 0;
  var date = new Date();
  var target_time = Math.floor(
    new Date(
      date.getFullYear() - years,
      date.getMonth() - months,
      date.getDate() - days
    ).getTime() / 1000
  );
  return target_time;
}

convert2datetime.PropTypes = {
  years: PropTypes.string,
  months: PropTypes.string,
  days: PropTypes.string,
};

export function convertToBase64(bytes) {
  return bytes.toString("base64");
}

export function convertFromBase64(str) {
  return Buffer.from(str, "base64");
}

export function encode_utf8(str) {
  return unescape(encodeURIComponent(str));
}

export function decode_utf8(str) {
  return decodeURIComponent(escape(str));
}

export function unit8_to_base64(array) {
  return Buffer.from(array).toString("base64");
}

export function unit8_to_utf8(array) {
  var decodedBytes = new TextDecoder("utf8").decode(array).toString();
  return decodedBytes;
}

export function unit8_to_binary(array) {
  var decodedBytes = new TextDecoder("latin1").decode(array).toString();
  return decodedBytes;
}

export function str2hex(str) {
  var search_string2hex = Buffer.from(str, "hex").toString();
  return search_string2hex;
}

export function array2hex(array) {
  var string_bytes = array.toString("hex");
  return string_bytes;
}

export function binarySearch(fileBytes, start, str) {
  // return the last instance of the search str index within the bytes
  var startIndex = -1;
  var search_string_array = Buffer.from(str);
  for (let i = start; i < fileBytes.length; i++) {
    if (fileBytes[i] == search_string_array[0]) {
      let found = true;
      let a = 0;
      let temp = [];
      while (found && a < search_string_array.length) {
        if (fileBytes[i] != search_string_array[a]) {
          found = false;
          i--;
        } else {
          temp.push(fileBytes[i]);
          a++;
          i++;
        }
      }
      if (temp.length > 2) {
        //console.log(temp);
      }
      if (found) {
        //console.log("found");
        startIndex = i;
        break;
      }
    }
  }
  return startIndex;
}

export function insertAt(bytes, index) {
  var bytesToInsert = Array.prototype.splice.apply(arguments, [2]);
  return insertArrayAt(bytes, index, bytesToInsert);
}

export function insertArrayAt(bytes, index, bytesToInsert) {
  Array.prototype.splice.apply(bytes, [index, 0].concat(bytesToInsert));
  return bytes;
}

export function addVariable2PDF(fileBytes, variable_name, variable_value) {
  // variables
  var search_string = "/Subtype/Widget/T(" + variable_name + ")";
  var startByte = 0;
  // binary data setup
  var start_index = binarySearch(fileBytes, startByte, search_string);
  var start_annot = binarySearch(fileBytes, start_index, "Annot");
  var first = fileBytes.slice(0, start_annot).join();
  var replacement = Buffer.from("/V(" + variable_value + ")>").join();
  var second = fileBytes.slice(start_annot + 1).join();
  console.log(fileBytes.slice(start_index - 20, start_annot + 20).toString());
  // recombination of data
  var new_fileBytes = mergeUINT8Arrays([first, replacement, second]);

  // var new_fileBytes = mergeUINT8Arrays([first, replacement, second]);
  return new_fileBytes;
}

export function mergeDateTime(date, time) {
  var combined;
  if (date != undefined && time != undefined) {
    var timeString = time.getHours() + ":" + time.getMinutes() + ":00";
    var year = date.getFullYear();
    var month = date.getMonth() + 1; // Jan is 0, dec is 11
    var day = date.getDate();
    var dateString = "" + year + "-" + month + "-" + day;
    combined = new Date(dateString + " " + timeString).toISOString();
  } else {
    combined = new Date().toISOString();
  }

  return combined;
}

export function iso2locale(datetime) {
  var formattedString = new Date(datetime.slice(0, -1)).toLocaleString();
  return formattedString;
}

export function downloadCSV(columns, rows, filename) {
  var data = [];
  for (let i = 0; i < columns.length; i++) {
    data.push(columns[i]["headerName"] + ",");
  }
  data.push("\n");
  for (let i = 0; i < rows.length; i++) {
    for (let [key, value] of Object.entries(rows[i])) {
      data.push(value + ",");
    }
    data.push("\n");
  }
  const blob = new Blob(data, { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("href", url);
  let dateString = new Date().toLocaleDateString().replace("/", "-");
  a.setAttribute("download", filename + "," + dateString + ".csv");
  a.click();
}

export function mergeUINT8Arrays(arrays) {
  // Get the total length of all arrays.
  let length = 0;
  arrays.forEach((item) => {
    length += item.length;
  });

  // Create a new array with total length and merge all source arrays.
  let mergedArray = new Uint8Array(length);
  let offset = 0;
  arrays.forEach((item) => {
    mergedArray.set(item, offset);
    offset += item.length;
  });

  return mergedArray;
}

export function dataURItoBlob(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;
  if (dataURI.split(",")[0].indexOf("base64") >= 0)
    byteString = Buffer.from(dataURI.split(",")[1], "base64");
  else byteString = decodeURI(dataURI.split(",")[1]);

  // separate out the mime component
  var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], { type: mimeString });
  // new Blob(newBytes, { type: "application/pdf" })
}

export async function base64toBlob(base64) {
  const b64toBlob = (bytes, type = "application/octet-stream") =>
    fetch(`data:${type};base64,${bytes}`).then((res) => {
      res.blob().then((Blob) => {
        return Blob;
      });
    });
  return await b64toBlob(base64);
}

export function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  var mathPow = Math.pow;
  var maxWord = mathPow(2, 32);
  var lengthProperty = "length";
  var i, j; // Used as a counter across the whole file
  var result = "";

  var words = [];
  var asciiBitLength = ascii[lengthProperty] * 8;

  //* caching results is optional - remove/add slash from front of this line to toggle
  // Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
  // (we actually calculate the first 64, but extra values are just ignored)
  var hash = (sha256.h = sha256.h || []);
  // Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
  var k = (sha256.k = sha256.k || []);
  var primeCounter = k[lengthProperty];
  /*/
  var hash = [], k = [];
  var primeCounter = 0;
  //*/

  var isComposite = {};
  for (var candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += "\x80"; // Append Ƈ' bit (plus zero padding)
  while ((ascii[lengthProperty] % 64) - 56) ascii += "\x00"; // More zero padding
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return; // ASCII check: only accept characters in range 0-255
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  // process each chunk
  for (j = 0; j < words[lengthProperty]; ) {
    var w = words.slice(j, (j += 16)); // The message is expanded into 64 words as part of the iteration
    var oldHash = hash;
    // This is now the undefinedworking hash", often labelled as variables a...g
    // (we have to truncate as well, otherwise extra entries at the end accumulate
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      var i2 = i + j;
      // Expand the message into 64 words
      // Used below if
      var w15 = w[i - 15],
        w2 = w[i - 2];

      // Iterate
      var a = hash[0],
        e = hash[4];
      var temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + // S1
        ((e & hash[5]) ^ (~e & hash[6])) + // ch
        k[i] +
        // Expand the message schedule if needed
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + // s0
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | // s1
              0);
      // This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
      var temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + // S0
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj

      hash = [(temp1 + temp2) | 0].concat(hash); // We don't bother trimming off the extra ones, they're harmless as long as we're truncating when we do the slice()
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      var b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : "") + b.toString(16);
    }
  }
  return result;
}

export function validateEmail(email) {
  var mailformat = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (email.match(mailformat)) {
    return true;
  }
  return false;
}

export function get_set_mojo_orig(event) {
  // check if function is to update customer
  if (event.target.name.toLowerCase().includes("Customer", 0)) {
    let field_name = event.target.name.toLowerCase();
    let sections = field_name.split(";");
    let parsed_str = "";
    // algo for each field
    for (let sec_num = 0; sec_num < sections.length; sec_num++) {
      if (sections[sec_num].includes("->")) {
        // -> is the function call for set method
        let setFields = sections[sec_num].split("->");
        let key_value = "[replace]";
        for (let i = 1; i < setFields.length; i++) {
          let key_name = setFields[i].replace(" ", "");
          if (i < setFields.length - 1) {
            key_value = key_value.replace(
              "[replace]",
              '{ "' + key_name + '":' + "[replace] }"
            );
          } else {
            key_value = key_value.replace("[replace]", key_name);
          }
        }
        key_value.replace("[replace]", event.target.value);
        parsed_str = JSON.parse(key_value);
        //console.log(parsed_str);
      } else if (sections[sec_num].includes(",")) {
        // , is for multiple values ... is this even needed?
        console.log("Comma\t" + sections[sec_num]);
      } else if (sections[sec_num].includes("@")) {
        // @ is get method to update field from customer record if field exists
        let getFields = sections[sec_num].split("@");
      }
    }
    return parsed_str;
  }
}

export function formatPhone(phoneNumberString) {
  var cleaned = ("" + phoneNumberString).replace(/\D/g, "");
  var match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    var intlCode = match[1] ? "+1 " : "";
    return [intlCode, "(", match[2], ") ", match[3], "-", match[4]].join("");
  }
  return null;
}
