import { useState, useRef } from 'react'
import { Upload, FileText, CreditCard, ShoppingBag, Check, AlertCircle, X } from 'lucide-react'
import { useTransactionStore } from '../../stores/transactionStore'
import { useInitStore } from '../../hooks/useInitStore'
import { categorize } from '../../lib/categorizationEngine'
import { parseBankFile, parseBankCSV } from '../../lib/bankParser'
import ExcelJS from 'exceljs'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'

const sources = [
  { id: '支付宝', name: '支付宝', icon: FileText, color: 'bg-blue-500' },
  { id: '微信', name: '微信', icon: FileText, color: 'bg-green-500' },
  { id: '银行卡', name: '银行卡', icon: CreditCard, color: 'bg-indigo-500' },
  { id: '京东', name: '京东', icon: ShoppingBag, color: 'bg-red-500' },
  { id: '通用CSV', name: '通用CSV', icon: Upload, color: 'bg-gray-500' },
]

interface ParsedRow {
  datetime: string
  amount: number
  direction: 'income' | 'expense'
  description: string
  category: string
  sub_category?: string
  source: string
  source_transaction_id?: string
}

function detectAndParse(content: string, sourceId: string): ParsedRow[] {
  const results: ParsedRow[] = []
  
  const lines = content.split(/\r?\n/)
  
  if (lines.length === 0) return results
  
  console.log(`Parsing ${sourceId}, total lines: ${lines.length}`)
  console.log(`First 5 lines:`, lines.slice(0, 5).map(l => l.substring(0, 80)))
  
  // Find header row - skip all metadata before the actual CSV header
  // Look for line with comma-separated headers containing "时间" and "金额"
  let headerIdx = 0
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const line = lines[i]
    // Must have multiple commas to be a data header
    const commaCount = (line.match(/,/g) || []).length
    if (commaCount < 5) continue
    
    const lower = line.toLowerCase()
    // Must contain time and amount related keywords
    if (lower.includes('时间') && (lower.includes('金额') || lower.includes('收') || lower.includes('支'))) {
      headerIdx = i
      break
    }
  }
  
  console.log(`Header found at line ${headerIdx}: ${lines[headerIdx].substring(0, 150)}`)
  
  // Parse headers - use comma delimiter
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
  
  console.log('Detected headers:', headers)
  
  // Find column indices
  const datePatterns = ['时间', 'date', 'datetime', '日期', '创建时间', '交易时间']
  const amountPatterns = ['金额', 'amount', '实付', '支出', '收入']
  const descPatterns = ['商品说明', '商品', '说明', 'description', '描述', '商户', '备注', '交易说明', '商户名称']
  const dirPatterns = ['收/支', '收', '支', '类型', 'direction', '状态']
  const categoryPatterns = ['交易分类', '分类', 'category', '类型']
  const txIdPatterns = ['订单号', '交易订单号', 'order', '订单']
  
  // Use includes for exact matches first
  const dateIdx = headers.findIndex(h => h === '交易时间' || h.includes('时间'))
  const amountIdx = headers.findIndex(h => h === '金额')
  const descIdx = headers.findIndex(h => h === '商品说明' || h === '说明' || h.includes('商品') || h.includes('描述') || h === '交易说明' || h === '商户名称')
  const dirIdx = headers.findIndex(h => h === '收/支')
  const categoryIdx = headers.findIndex(h => h === '交易分类' || h === '分类')
  const txIdIdx = headers.findIndex(h => h.includes('订单号'))
  
  console.log(`Indices - date: ${dateIdx}, amount: ${amountIdx}, desc: ${descIdx}, dir: ${dirIdx}, category: ${categoryIdx}, txId: ${txIdIdx}`)

  // Try parsing each row
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.length === 0) continue
    // Skip separator lines
    if (/^[-=]{10,}$/.test(line)) continue
    
    // Handle CSV with quotes - use comma delimiter
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
    
    if (values.length <= Math.max(dateIdx, amountIdx)) continue
    
    const dateStr = dateIdx >= 0 ? values[dateIdx] : ''
    const amountStr = amountIdx >= 0 ? values[amountIdx] : ''
    const desc = descIdx >= 0 ? values[descIdx] : ''
    const dirStr = dirIdx >= 0 ? values[dirIdx] : ''
    const category = categoryIdx >= 0 ? values[categoryIdx] : ''
    const txId = txIdIdx >= 0 ? values[txIdIdx]?.trim() : ''
    
    if (!dateStr || !amountStr) continue
    
    // Parse amount (remove currency symbols, etc)
    const cleanAmount = amountStr.replace(/[¥￥$€£\s,]/g, '').replace(/[^\d.-]/g, '')
    const amount = parseFloat(cleanAmount)
    if (isNaN(amount) || amount === 0) continue
    
    // Parse date
    const date = new Date(dateStr.replace(/\//g, '-'))
    if (isNaN(date.getTime())) {
      // Try some other date formats
      const parts = dateStr.split(/[-/\.]/)
      if (parts.length >= 3) {
        date.setFullYear(parseInt(parts[0]))
        date.setMonth(parseInt(parts[1]) - 1)
        date.setDate(parseInt(parts[2]))
      }
    }
    if (isNaN(date.getTime())) continue
    
    // Determine direction
    let direction: 'income' | 'expense' = 'expense'
    
    // Check if it's a refund (退款)
    const isRefund = desc.includes('退')
    
    // Handle "不计收支" (京东) - 信用卡还款等
    if (dirStr.includes('不计') || dirStr === '不计收支') {
      // 跳过不计收支的交易，或者可以根据描述判断
      if (desc.includes('信用卡还款')) {
        // 信用卡还款不算收支
        continue
      }
    }
    
    if (isRefund || (dirStr.includes('收') && !dirStr.includes('支'))) {
      direction = 'income'
    } else if (dirStr.includes('支')) {
      direction = 'expense'
    }
    
    // Apply categorization
    const catResult = categorize(desc, category)
    
    results.push({
      datetime: date.toISOString(),
      amount: Math.abs(amount),
      direction,
      description: desc || '未知',
      category: catResult.category,
      sub_category: catResult.sub_category,
      source: sourceId,
      source_transaction_id: txId || undefined,
    })
  }
  
  console.log(`Parsed ${results.length} rows`)
  return results
}

async function parseExcelFile(file: File, sourceId: string): Promise<ParsedRow[]> {
  const results: ParsedRow[] = []
  
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)
    
    console.log('Workbook sheets:', workbook.worksheets.map(w => w.name))
    
    // Try to find the sheet with data
    let worksheet = workbook.getWorksheet(1)
    if (!worksheet) return results
    
    console.log(`Worksheet: ${worksheet.name}, rows: ${worksheet.rowCount}`)
    
    // Find the actual data header row (skip metadata rows)
    // WeChat Excel has metadata in rows 1-15, header at row 16
    let headerRowNum = 16
    let foundHeaders = false
    
    for (let i = 16; i <= 20 && i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i)
      const cells: string[] = []
      row.eachCell((cell) => {
        cells.push(String(cell.value || '').toLowerCase())
      })
      
      const hasDate = cells.some(c => c.includes('时间') || c.includes('日期'))
      const hasAmount = cells.some(c => c.includes('金额') || c.includes('支出') || c.includes('收入'))
      
      if (hasDate && hasAmount) {
        headerRowNum = i
        foundHeaders = true
        break
      }
    }
    
    if (!foundHeaders) {
      console.log('Could not find data header row')
      return results
    }
    
    // Get headers from the found header row
    const headers: string[] = []
    const headerRow = worksheet.getRow(headerRowNum)
    headerRow.eachCell((cell) => {
      headers.push(String(cell.value || '').toLowerCase())
    })
    
    console.log('Excel headers:', headers)
    
    // Find column indices
    const dateIdx = headers.findIndex(h => h.includes('时间') || h.includes('日期'))
    const amountIdx = headers.findIndex(h => h.includes('金额') || h.includes('支出') || h.includes('收入'))
    const descIdx = headers.findIndex(h => h.includes('商品') || h.includes('说明') || h.includes('描述') || h.includes('项目') || h.includes('交易对方'))
    const dirIdx = headers.findIndex(h => h.includes('收') || h.includes('支') || h.includes('类型') || h.includes('状态'))
    const txIdIdx = headers.findIndex(h => h.includes('订单') || h.includes('号') || h.includes('商户'))
    
    console.log(`Excel indices - date: ${dateIdx}, amount: ${amountIdx}, desc: ${descIdx}, dir: ${dirIdx}`)
    
    // Parse each row starting after header
    let rowCount = 0
    worksheet.eachRow((row, rowNum) => {
      if (rowNum <= headerRowNum) return // Skip header and metadata rows
      
      const values: string[] = []
      row.eachCell((cell) => {
        values.push(String(cell.value || ''))
      })
      
      // Skip empty rows
      if (values.every(v => !v.trim())) return
      
      if (values.length <= Math.max(dateIdx, amountIdx)) return
      
      const dateStr = dateIdx >= 0 ? values[dateIdx] : ''
      const amountStr = amountIdx >= 0 ? values[amountIdx] : ''
      const desc = descIdx >= 0 ? values[descIdx] : ''
      const dirStr = dirIdx >= 0 ? values[dirIdx] : ''
      const txId = txIdIdx >= 0 ? values[txIdIdx] : ''
      
      if (!dateStr || !amountStr) return
      
      // Parse amount
      const cleanAmount = amountStr.replace(/[¥￥$€£\s,]/g, '').replace(/[^\d.-]/g, '')
      const amount = parseFloat(cleanAmount)
      if (isNaN(amount) || amount === 0) return
      
      // Parse date
      const date = new Date(dateStr.replace(/\//g, '-'))
      if (isNaN(date.getTime())) {
        console.log(`Row ${rowNum}: Invalid date "${dateStr}"`)
        return
      }
      
      rowCount++
      console.log(`Row ${rowCount}: date=${dateStr.substring(0, 10)}, amount=${amount}, dir=${dirStr}`)
      
      // Determine direction based on transaction type
      let direction: 'income' | 'expense' = 'expense'
      
      // Use the "收/支" column directly if available
      if (dirStr.includes('收入') || dirStr.includes('收')) {
        direction = 'income'
      } else if (dirStr.includes('支出') || dirStr.includes('支')) {
        direction = 'expense'
      } else {
        // Fall back to transaction type inference
        const isRefund = desc.includes('退') || dirStr.includes('退款')
        
        if (isRefund) {
          direction = 'income'
        } else if (
          dirStr.includes('收款') || 
          dirStr === '其他' || 
          (dirStr.includes('亲属卡') && !dirStr.includes('消费'))
        ) {
          direction = 'income'
        } else if (
          dirStr.includes('消费') || 
          dirStr.includes('红包') || 
          dirStr.includes('转账') || 
          dirStr.includes('付款') || 
          dirStr.includes('缴费') ||
          (dirStr.includes('亲属卡') && dirStr.includes('消费'))
        ) {
          direction = 'expense'
        }
      }
      
      // Apply categorization
      const catResult = categorize(desc, '')
      
      results.push({
        datetime: date.toISOString(),
        amount: Math.abs(amount),
        direction,
        description: desc || '未知',
        category: catResult.category,
        sub_category: catResult.sub_category,
        source: sourceId,
        source_transaction_id: txId || undefined,
      })
    })
    
    console.log(`Parsed ${results.length} rows from Excel, processed ${rowCount} data rows`)
  } catch (e) {
    console.error('Excel parsing error:', e)
  }
  
  return results
}

async function tryDifferentEncodings(file: File, defaultContent: string): Promise<string> {
  const hasGarbledChars = defaultContent.includes('\uFFFD') || /[\uFFFD]/.test(defaultContent.substring(0, 500))
  
  if (!hasGarbledChars) return defaultContent
  
  // Try GBK
  const gbkContent = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file, 'GBK')
  })
  
  if (!gbkContent.includes('\uFFFD')) return gbkContent
  
  // Try GB2312
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file, 'GB2312')
  })
}

async function readFileContent(file: File): Promise<string> {
  return await file.text()
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer()
}

export function ImportPage() {
  const { isInitialized } = useInitStore()
  const { addTransactions, isLoading } = useTransactionStore()
  const [selectedSource, setSelectedSource] = useState<string>('csv')
  const [previewData, setPreviewData] = useState<ParsedRow[]>([])
  const [fullData, setFullData] = useState<ParsedRow[]>([])
  const [totalParsed, setTotalParsed] = useState<number>(0)
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')

  const handleSourceClick = (sourceId: string) => {
    setSelectedSource(sourceId)
    setPreviewData([])
    setFullData([])
    setTotalParsed(0)
    setImportResult(null)
    setError(null)
    setDebugInfo('')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSelecting(false)
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      setDebugInfo('正在读取文件...')
      
      const fileName = file.name.toLowerCase()
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
      
      let parsed: ParsedRow[]
      
      // Route to appropriate parser based on source
      if (selectedSource === '银行卡') {
        // Bank parser
        if (isExcel) {
          setDebugInfo('检测到银行Excel文件，正在解析...')
          parsed = await parseBankFile(file, { sourceId: selectedSource })
        } else {
          // Bank CSV
          let content = await file.text()
          // Try different encodings
          content = await tryDifferentEncodings(file, content)
          setDebugInfo(`文件读取完成，内容长度: ${content.length} 字符`)
          parsed = parseBankCSV(content, selectedSource)
        }
      } else if (selectedSource === '微信' || selectedSource === '京东') {
        // Excel parsers for WeChat and JD
        if (isExcel) {
          setDebugInfo('检测到Excel文件，正在解析...')
          if (selectedSource === '微信') {
            parsed = await parseExcelFile(file, selectedSource)
          } else {
            parsed = await parseBankFile(file, { sourceId: selectedSource }) // Use bank parser for JD Excel
          }
        } else {
          setError('请选择XLSX格式的文件')
          return
        }
      } else {
        // CSV parsers for Alipay and generic CSV
        if (isExcel) {
          // Some banks export as Excel even when selected as CSV
          parsed = await parseBankFile(file, { sourceId: selectedSource })
        } else {
          let content = await file.text()
          content = await tryDifferentEncodings(file, content)
          setDebugInfo(`文件读取完成，内容长度: ${content.length} 字符`)
          parsed = detectAndParse(content, selectedSource)
        }
      }
      
      setDebugInfo(`解析完成，找到 ${parsed.length} 条记录`)
      setTotalParsed(parsed.length)
      setFullData(parsed)
      setPreviewData(parsed.slice(0, 10))
      
      if (parsed.length === 0) {
        setError('未能解析出任何数据，请检查文件格式是否正确')
        setDebugInfo('解析结果为空，可能是：\n1. 文件格式不标准\n2. 没有表头行\n3. 数据列不在预期位置')
        return
      }
      
      setError(null)
    } catch (err) {
      console.error('Parse error:', err)
      setError('读取文件失败: ' + (err instanceof Error ? err.message : '未知错误'))
      setDebugInfo('错误: ' + (err instanceof Error ? err.message : String(err)))
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSelectClick = () => {
    setIsSelecting(true)
    fileInputRef.current?.click()
  }

  const handleImport = async () => {
    if (fullData.length === 0) return
    
    try {
      setError(null)
      const result = await addTransactions(fullData)
      setImportResult(result)
      setPreviewData([])
      setFullData([])
      setDebugInfo('')
    } catch (err) {
      console.error('Import error:', err)
      setError('导入失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  const handleReset = () => {
    setPreviewData([])
    setFullData([])
    setTotalParsed(0)
    setImportResult(null)
    setError(null)
    setDebugInfo('')
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-2xl font-bold mb-2">导入账单</h1>
        <p className="text-gray-500 text-sm">选择账单来源，导入您的账单数据</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">选择数据来源</h2>
        <div className="flex flex-wrap gap-3">
          {sources.map((source) => (
            <button
              key={source.id}
              onClick={() => handleSourceClick(source.id)}
              className={`px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                selectedSource === source.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className={`w-8 h-8 ${source.color} rounded flex items-center justify-center`}>
                <source.icon className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">{source.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            导入 {sources.find(s => s.id === selectedSource)?.name} 账单
          </h2>
          {previewData.length > 0 && (
            <button onClick={handleReset} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {previewData.length === 0 ? (
          <div className="text-center py-8">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleSelectClick}
              disabled={isLoading}
              className="btn btn-primary flex items-center gap-2 mx-auto"
            >
              <Upload className="w-5 h-5" />
              {isLoading ? '处理中...' : '选择文件'}
            </button>
            <p className="text-gray-500 mt-4 text-sm">
              支持 CSV、TXT、Excel 格式
            </p>
            {debugInfo && (
              <p className="text-gray-400 mt-2 text-xs font-mono">{debugInfo}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Check className="w-5 h-5" />
                <span>解析成功，找到 {previewData.length} 条记录（共计 {totalParsed} 条）</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left">时间</th>
                    <th className="px-3 py-2 text-left">类型</th>
                    <th className="px-3 py-2 text-left">金额</th>
                    <th className="px-3 py-2 text-left">描述</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="border-t dark:border-gray-700">
                      <td className="px-3 py-2">{new Date(row.datetime).toLocaleDateString()}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          row.direction === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {row.direction === 'income' ? '收入' : '支出'}
                        </span>
                      </td>
                      <td className="px-3 py-2">¥{row.amount.toFixed(2)}</td>
                      <td className="px-3 py-2 truncate max-w-xs">{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={isLoading}
              >
                {isLoading ? '导入中...' : '确认导入'}
              </button>
              <button className="btn btn-secondary" onClick={handleReset}>
                重新选择
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {importResult && (
          <div className="mt-4 bg-green-50 dark:bg-green-900 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Check className="w-5 h-5" />
              <span>导入成功！新增 {importResult.imported} 条，跳过重复 {importResult.duplicates} 条</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}