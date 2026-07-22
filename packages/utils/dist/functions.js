/**
 * Generates random number with given number of digits.
 * @param digits the number digits the random number should have.
 * @returns the number generated.
 */
export function generateRandomNumber(digits = 4) {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
