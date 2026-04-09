import ExcelJS from 'exceljs'

interface ParsedRow {
  datetime: string
  amount: number
  direction: 'income' | 'expense'
  description: string
  category: string
  sub_category: string
  source: string
  source_transaction_id?: string
}

interface BankParseOptions {
  sourceId: string
  skipMetadataRows?: number
}

export async function parseBankFile(file: File, options: BankParseOptions): Promise<ParsedRow[]> {
  const results: ParsedRow[] = []
  const { sourceId } = options

  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    const worksheet = workbook.getWorksheet(1)
    if (!worksheet) return results

    console.log(`Bank parser: ${worksheet.name}, rows: ${worksheet.rowCount}`)

    // Step 1: Find the header row (skip metadata)
    const headerRowNum = findHeaderRow(worksheet)
    if (headerRowNum === -1) {
      console.log('Bank parser: Could not find header row')
      return results
    }

    console.log(`Bank parser: Header found at row ${headerRowNum}`)

    // Step 2: Parse headers
    const headers: string[] = []
    const headerRow = worksheet.getRow(headerRowNum)
    headerRow.eachCell((cell) => {
      headers.push(String(cell.value || '').toLowerCase())
    })

    console.log(`Bank parser: Headers:`, headers.slice(0, 8))

    // Step 3: Find column indices
    const indices = findColumnIndices(headers)
    console.log(`Bank parser: Indices - date: ${indices.dateIdx}, income: ${indices.incomeIdx}, expense: ${indices.expenseIdx}, desc: ${indices.descIdx}, counterparty: ${indices.counterpartyIdx}`)

    // Step 4: Parse data rows
    let rowCount = 0
    worksheet.eachRow((row, rowNum) => {
      if (rowNum <= headerRowNum) return

      const values: string[] = []
      row.eachCell((cell) => {
        values.push(String(cell.value || ''))
      })

      // Skip empty rows
      if (values.every(v => !v.trim())) return

      const dateStr = indices.dateIdx >= 0 ? values[indices.dateIdx] : ''
      const incomeStr = indices.incomeIdx >= 0 ? values[indices.incomeIdx] : ''
      const expenseStr = indices.expenseIdx >= 0 ? values[indices.expenseIdx] : ''
      const desc = indices.descIdx >= 0 ? values[indices.descIdx] : ''
      const counterparty = indices.counterpartyIdx >= 0 ? values[indices.counterpartyIdx] : ''

      if (!dateStr) return

      // Parse date
      const date = parseBankDate(dateStr)
      if (!date || isNaN(date.getTime())) return

      // Parse amount - bank usually has separate income/expense columns
      let amount = 0
      let direction: 'income' | 'expense' = 'expense'

      const cleanIncome = incomeStr.replace(/[¥￥$€£\s,]/g, '').replace(/[^\d.-]/g, '')
      const cleanExpense = expenseStr.replace(/[¥￥$€£\s,]/g, '').replace(/[^\d.-]/g, '')

      const incomeAmount = parseFloat(cleanIncome) || 0
      const expenseAmount = parseFloat(cleanExpense) || 0

      if (incomeAmount > 0) {
        amount = incomeAmount
        direction = 'income'
      } else if (expenseAmount > 0) {
        amount = expenseAmount
        direction = 'expense'
      } else {
        return // Skip rows with no amount
      }

      rowCount++

      // Categorize
      const category = categorizeBankTransaction(desc, counterparty)

      results.push({
        datetime: date.toISOString(),
        amount: Math.abs(amount),
        direction,
        description: desc || counterparty || '未知',
        category: category.category,
        sub_category: category.sub_category,
        source: sourceId,
      })
    })

    console.log(`Bank parser: Parsed ${results.length} rows, processed ${rowCount} data rows`)

  } catch (e) {
    console.error('Bank parser error:', e)
  }

  return results
}

function findHeaderRow(worksheet: ExcelJS.Worksheet): number {
  // Scan first 30 rows to find header
  for (let i = 1; i <= Math.min(30, worksheet.rowCount); i++) {
    const row = worksheet.getRow(i)
    const cells: string[] = []
    row.eachCell((cell) => {
      cells.push(String(cell.value || '').toLowerCase())
    })

    // Header should contain date-related keywords
    const hasDate = cells.some(c => c.includes('时间') || c.includes('日期') || c.includes('交易时间'))
    // And amount-related keywords
    const hasAmount = cells.some(c => c.includes('金额') || c.includes('收入') || c.includes('支出') || c.includes('余额'))

    if (hasDate && hasAmount) {
      return i
    }
  }

  // Default to row 5 if not found (common for bank statements)
  return 5
}

function findColumnIndices(headers: string[]) {
  return {
    dateIdx: headers.findIndex(h => h.includes('时间') || h.includes('日期') || h.includes('交易时间')),
    incomeIdx: headers.findIndex(h => h.includes('收入') || h.includes('存入') || h.includes('转入')),
    expenseIdx: headers.findIndex(h => h.includes('支出') || h.includes('转出') || h.includes('支出金额')),
    descIdx: headers.findIndex(h => h.includes('摘要') || h.includes('说明') || h.includes('描述') || h.includes('交易类型')),
    counterpartyIdx: headers.findIndex(h => h.includes('对方') || h.includes('户名') || h.includes('账户') || h.includes('收款') || h.includes('付款')),
    balanceIdx: headers.findIndex(h => h.includes('余额') || h.includes('账户余额')),
  }
}

function parseBankDate(dateStr: string): Date | null {
  if (!dateStr) return null

  // Try standard formats
  let date = new Date(dateStr.replace(/\//g, '-'))
  if (!isNaN(date.getTime())) return date

  // Try format: YYYYMMDD
  if (/^\d{8}$/.test(dateStr)) {
    const year = parseInt(dateStr.substring(0, 4))
    const month = parseInt(dateStr.substring(4, 6)) - 1
    const day = parseInt(dateStr.substring(6, 8))
    return new Date(year, month, day)
  }

  // Try format: YYYY.MM.DD
  if (/^\d{4}\.\d{2}\.\d{2}/.test(dateStr)) {
    date = new Date(dateStr.replace(/\./g, '-'))
    if (!isNaN(date.getTime())) return date
  }

  return null
}

function categorizeBankTransaction(description: string, counterparty: string): { category: string; sub_category: string } {
  const text = `${description || ''} ${counterparty || ''}`

  // Common bank keywords mapping
  const keywordMap: Record<string, { category: string; sub_category: string }> = {
    '转账': { category: '社交', sub_category: '转账' },
    '红包': { category: '社交', sub_category: '红包' },
    '工资': { category: '收入', sub_category: '工资' },
    '奖金': { category: '收入', sub_category: '工资' },
    '退款': { category: '收入', sub_category: '退款' },
    '还款': { category: '金融', sub_category: '还款' },
    '消费': { category: '其他', sub_category: '其他' },
    '购物': { category: '购物', sub_category: '网购' },
    '话费': { category: '通讯', sub_category: '话费' },
    '水电': { category: '居住', sub_category: '水电煤' },
    '物业': { category: '居住', sub_category: '水电煤' },
    '保险': { category: '金融', sub_category: '保险' },
  }

  for (const [keyword, cat] of Object.entries(keywordMap)) {
    if (text.includes(keyword)) {
      return cat
    }
  }

  return { category: '其他', sub_category: '其他' }
}

export function parseBankCSV(content: string, sourceId: string): ParsedRow[] {
  const results: ParsedRow[] = []
  const lines = content.split(/\r?\n/).filter(line => line.trim())

  if (lines.length === 0) return results

  console.log(`Bank CSV parser: ${sourceId}, total lines: ${lines.length}`)

  // Find header row
  let headerIdx = 0
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const line = lines[i]
    const commaCount = (line.match(/,/g) || []).length
    if (commaCount < 3) continue

    const lower = line.toLowerCase()
    if (lower.includes('时间') && (lower.includes('金额') || lower.includes('收入') || lower.includes('支出'))) {
      headerIdx = i
      break
    }
  }

  console.log(`Bank CSV parser: Header at row ${headerIdx}`)

  // Parse headers
  const headers: string[] = []
  let inQuotes = false
  let current = ''
  for (const char of lines[headerIdx]) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      headers.push(current.trim().toLowerCase())
      current = ''
    } else {
      current += char
    }
  }
  headers.push(current.trim().toLowerCase())

  // Find indices
  const indices = findColumnIndices(headers)
  console.log(`Bank CSV parser: Indices - date: ${indices.dateIdx}, income: ${indices.incomeIdx}, expense: ${indices.expenseIdx}`)

  // Parse rows
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || /^[-=]{10,}$/.test(line)) continue

    // Parse CSV row
    const values: string[] = []
    let inQ = false
    let val = ''
    for (const char of line) {
      if (char === '"') {
        inQ = !inQ
      } else if (char === ',' && !inQ) {
        values.push(val.trim().replace(/^"|"$/g, ''))
        val = ''
      } else {
        val += char
      }
    }
    values.push(val.trim().replace(/^"|"$/g, ''))

    const dateStr = indices.dateIdx >= 0 ? values[indices.dateIdx] : ''
    const incomeStr = indices.incomeIdx >= 0 ? values[indices.incomeIdx] : ''
    const expenseStr = indices.expenseIdx >= 0 ? values[indices.expenseIdx] : ''
    const desc = indices.descIdx >= 0 ? values[indices.descIdx] : ''
    const counterparty = indices.counterpartyIdx >= 0 ? values[indices.counterpartyIdx] : ''

    if (!dateStr) continue

    // Parse amount
    const cleanIncome = incomeStr.replace(/[¥￥$€£\s,]/g, '').replace(/[^\d.-]/g, '')
    const cleanExpense = expenseStr.replace(/[¥￥$€£\s,]/g, '').replace(/[^\d.-]/g, '')

    const incomeAmount = parseFloat(cleanIncome) || 0
    const expenseAmount = parseFloat(cleanExpense) || 0

    if (incomeAmount === 0 && expenseAmount === 0) continue

    const date = parseBankDate(dateStr)
    if (!date || isNaN(date.getTime())) continue

    const direction = incomeAmount > 0 ? 'income' : 'expense'
    const amount = Math.abs(incomeAmount > 0 ? incomeAmount : expenseAmount)

    const category = categorizeBankTransaction(desc, counterparty)

    results.push({
      datetime: date.toISOString(),
      amount,
      direction,
      description: desc || counterparty || '未知',
      category: category.category,
      sub_category: category.sub_category,
      source: sourceId,
    })
  }

  console.log(`Bank CSV parser: Parsed ${results.length} rows`)
  return results
}