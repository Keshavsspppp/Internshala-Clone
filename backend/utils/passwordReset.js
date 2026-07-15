const crypto = require("crypto");

const PASSWORD_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const generateLetterPassword = (length = 12) => {
  const normalizedLength = Math.max(12, Math.min(Number(length) || 12, 128));
  return Array.from(
    { length: normalizedLength },
    () => PASSWORD_LETTERS[crypto.randomInt(0, PASSWORD_LETTERS.length)]
  ).join("");
};

const isLetterOnlyPassword = (value) => /^[A-Za-z]+$/.test(String(value || ""));

module.exports = { generateLetterPassword, isLetterOnlyPassword };
