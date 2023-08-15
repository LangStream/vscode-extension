export default function randomNumberString(charLength:number = 3): string {
  return Math.floor(Math.random() * 1000).toString().substring(0, charLength);
}