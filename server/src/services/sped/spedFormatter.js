/**
 * Utilitário de Formatação de Registros SPED (Guia Prático da EFD)
 */
export class SpedFormatter {
  /**
   * Remove pipes e quebras de linha que invalidam a estrutura do SPED
   */
  static formatText(val) {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/\|/g, '')
      .replace(/[\r\n]+/g, ' ')
      .trim();
  }

  /**
   * Formata datas para o padrão oficial: ddmmyyyy (sem barras)
   */
  static formatDate(dateVal) {
    if (!dateVal) return '';
    // Aceita tanto string YYYY-MM-DD quanto Date
    let d;
    if (typeof dateVal === 'string' && dateVal.includes('-')) {
      const parts = dateVal.substring(0, 10).split('-');
      return `${parts[2]}${parts[1]}${parts[0]}`;
    }
    d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}${month}${year}`;
  }

  /**
   * Formata valores monetários com duas casas decimais e vírgula como separador
   */
  static formatMoney(val) {
    const num = parseFloat(val) || 0;
    return num.toFixed(2).replace('.', ',');
  }

  /**
   * Formata quantidades comerciais com até 4 casas decimais e vírgula
   */
  static formatQty(val, decimals = 4) {
    const num = parseFloat(val) || 0;
    return num.toFixed(decimals).replace('.', ',');
  }

  /**
   * Formata alíquotas com 2 ou 4 casas decimais e vírgula
   */
  static formatRate(val, decimals = 2) {
    const num = parseFloat(val) || 0;
    return num.toFixed(decimals).replace('.', ',');
  }

  /**
   * Constrói a linha delimitada por pipes conforme manual da RFB
   * Exemplo: |C100|0|1|FORN01|55|...|\r\n
   */
  static buildLine(fields) {
    return `|${fields.map(SpedFormatter.formatText).join('|')}|\r\n`;
  }
}
