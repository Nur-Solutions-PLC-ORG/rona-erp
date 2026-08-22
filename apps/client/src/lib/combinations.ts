export interface PasswordOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

export function generateCombinations(options: PasswordOptions = {}): string {
  const {
    length = 8,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = false,
  } = options;

  const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
  const NUMBERS = "0123456789";
  const SYMBOLS = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

  let availableChars = "";
  const guaranteedChars: string[] = [];

  if (includeUppercase) {
    availableChars += UPPERCASE;
    guaranteedChars.push(getRandomChar(UPPERCASE));
  }
  if (includeLowercase) {
    availableChars += LOWERCASE;
    guaranteedChars.push(getRandomChar(LOWERCASE));
  }
  if (includeNumbers) {
    availableChars += NUMBERS;
    guaranteedChars.push(getRandomChar(NUMBERS));
  }
  if (includeSymbols) {
    availableChars += SYMBOLS;
    guaranteedChars.push(getRandomChar(SYMBOLS));
  }

  if (availableChars.length === 0) {
    throw new Error("At least one character type must be selected.");
  }

  let password = guaranteedChars.join("");
  const remainingLength = length - guaranteedChars.length;

  for (let i = 0; i < remainingLength; i++) {
    password += getRandomChar(availableChars);
  }

  return shuffleString(password);
}

function getRandomChar(str: string): string {
  const randomIndex = Math.floor(Math.random() * str.length);
  return str[randomIndex];
}

function shuffleString(str: string): string {
  const arr = str.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}
