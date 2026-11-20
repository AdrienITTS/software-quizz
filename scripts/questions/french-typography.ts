/**
 * French puts a space before ? ! : ; and inside « ». A no-break space keeps the mark on the
 * same line as its word. Only spaces already there are replaced, so URLs and times are safe.
 */
export function frenchTypography(text: string): string {
  return text
    .replace(/ ([?!:;])/g, '\u00a0$1')
    .replace(/« /g, '«\u00a0')
    .replace(/ »/g, '\u00a0»')
}
