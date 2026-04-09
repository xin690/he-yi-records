// Categorization Engine - Pure function based categorization
// No database dependency - works with any storage

interface CategoryResult {
  category: string
  sub_category: string
  confidence: number
}

const merchantMap: Record<string, { category: string; sub_category: string }> = {
  // 餐饮
  '美团': { category: '餐饮', sub_category: '外卖' },
  '饿了么': { category: '餐饮', sub_category: '外卖' },
  '美团外卖': { category: '餐饮', sub_category: '外卖' },
  '麦当劳': { category: '餐饮', sub_category: '快餐' },
  '肯德基': { category: '餐饮', sub_category: '快餐' },
  '汉堡王': { category: '餐饮', sub_category: '快餐' },
  '必胜客': { category: '餐饮', sub_category: '快餐' },
  '星巴克': { category: '餐饮', sub_category: '饮品' },
  '瑞幸': { category: '餐饮', sub_category: '饮品' },
  '喜茶': { category: '餐饮', sub_category: '饮品' },
  '奈雪': { category: '餐饮', sub_category: '饮品' },
  '蜜雪冰城': { category: '餐饮', sub_category: '饮品' },
  '农夫刘先生': { category: '餐饮', sub_category: '外卖' },
  
  // 交通
  '滴滴': { category: '交通', sub_category: '打车' },
  '滴滴出行': { category: '交通', sub_category: '打车' },
  '高德打车': { category: '交通', sub_category: '打车' },
  '高德': { category: '交通', sub_category: '打车' },
  '花小猪': { category: '交通', sub_category: '打车' },
  '首汽约车': { category: '交通', sub_category: '打车' },
  '哈啰': { category: '交通', sub_category: '打车' },
  '哈啰出行': { category: '交通', sub_category: '打车' },
  '地铁': { category: '交通', sub_category: '公共交通' },
  '公交': { category: '交通', sub_category: '公共交通' },
  '中国石油': { category: '交通', sub_category: '加油' },
  '中石化': { category: '交通', sub_category: '加油' },
  '中国石化': { category: '交通', sub_category: '加油' },
  '杭州青奇': { category: '交通', sub_category: '打车' },
  
  // 通讯
  '中国电信': { category: '通讯', sub_category: '话费' },
  '中国联通': { category: '通讯', sub_category: '话费' },
  '中国移动': { category: '通讯', sub_category: '话费' },
  '中兴视通': { category: '通讯', sub_category: '话费' },
  
  // 购物
  '淘宝': { category: '购物', sub_category: '网购' },
  '天猫': { category: '购物', sub_category: '网购' },
  '京东': { category: '购物', sub_category: '网购' },
  '拼多多': { category: '购物', sub_category: '网购' },
  '唯品会': { category: '购物', sub_category: '网购' },
  '盒马': { category: '购物', sub_category: '日用品' },
  '永辉': { category: '购物', sub_category: '日用品' },
  '永辉超市': { category: '购物', sub_category: '日用品' },
  '沃尔玛': { category: '购物', sub_category: '日用品' },
  '宜家': { category: '购物', sub_category: '日用品' },
  '正弘城': { category: '购物', sub_category: '日用品' },
  '大众点评': { category: '购物', sub_category: '餐饮服务' },
  
  // 娱乐
  '抖音': { category: '娱乐', sub_category: '短视频' },
  '快手': { category: '娱乐', sub_category: '短视频' },
  '爱奇艺': { category: '娱乐', sub_category: '视频会员' },
  '腾讯视频': { category: '娱乐', sub_category: '视频会员' },
  '腾讯': { category: '娱乐', sub_category: '视频会员' },
  '优酷': { category: '娱乐', sub_category: '视频会员' },
  '网易云音乐': { category: '娱乐', sub_category: '音乐会员' },
  'QQ音乐': { category: '娱乐', sub_category: '音乐会员' },
  '携程': { category: '娱乐', sub_category: '旅游' },
  '飞猪': { category: '娱乐', sub_category: '旅游' },
  '山姆': { category: '购物', sub_category: '日用品' },
}

interface CategoryRule {
  keyword: RegExp
  category: string
  sub_category: string
}

const categoryRules: CategoryRule[] = [
  // 餐饮
  { keyword: /美团|饿了么|外卖/, category: '餐饮', sub_category: '外卖' },
  { keyword: /麦当劳|肯德基|汉堡王|必胜客/, category: '餐饮', sub_category: '快餐' },
  { keyword: /星巴克|瑞幸|咖啡|蜜雪/, category: '餐饮', sub_category: '饮品' },
  { keyword: /火锅|烧烤|川菜|粤菜|湘菜|日料|寿司/, category: '餐饮', sub_category: '正餐' },
  { keyword: /沙县|兰州拉面|黄焖鸡|麻辣烫|馄饨|米线|面条|包子|快餐/, category: '餐饮', sub_category: '快餐' },
  { keyword: /超市|便利店|沃尔玛|盒马|永辉|罗森|全家/, category: '购物', sub_category: '日用品' },
  { keyword: /水果|蔬菜|生鲜|农贸市场/, category: '购物', sub_category: '食品' },
  
  // 交通
  { keyword: /滴滴|打车|高德|花小猪|首汽|哈啰|打车/, category: '交通', sub_category: '打车' },
  { keyword: /地铁|公交|公交车|轨道交通/, category: '交通', sub_category: '公共交通' },
  { keyword: /加油|加油站|中石化|中石油/, category: '交通', sub_category: '加油' },
  { keyword: /停车|停车场/, category: '交通', sub_category: '停车' },
  { keyword: /火车|高铁|动车/, category: '交通', sub_category: '火车' },
  { keyword: /飞机|机票|航班/, category: '交通', sub_category: '飞机' },
  
  // 通讯
  { keyword: /话费|充值|移动|联通|电信|中兴/, category: '通讯', sub_category: '话费' },
  { keyword: /宽带|网费|光纤/, category: '通讯', sub_category: '网费' },
  
  // 购物
  { keyword: /淘宝|天猫|京东|拼多多|唯品会/, category: '购物', sub_category: '网购' },
  { keyword: /宜家|正弘城|商城/, category: '购物', sub_category: '日用品' },
  
  // 娱乐
  { keyword: /爱奇艺|腾讯|优酷|b站|会员/, category: '娱乐', sub_category: '会员' },
  { keyword: /网易云|QQ音乐|酷狗|音乐/, category: '娱乐', sub_category: '音乐' },
  { keyword: /游戏|Steam|Epic|网易游戏/, category: '娱乐', sub_category: '游戏' },
  { keyword: /电影|剧院|演唱会|门票/, category: '娱乐', sub_category: '文化' },
  { keyword: /携程|飞猪|酒店|旅游/, category: '娱乐', sub_category: '旅游' },
  
  // 医疗
  { keyword: /药|药店|药房/, category: '医疗', sub_category: '药品' },
  { keyword: /医院|门诊|体检/, category: '医疗', sub_category: '医疗' },
  
  // 教育
  { keyword: /学费|培训|课程|教育/, category: '教育', sub_category: '培训' },
  { keyword: /书|图书|亚马逊|当当/, category: '教育', sub_category: '书籍' },
  
  // 居住
  { keyword: /房租|租金/, category: '居住', sub_category: '房租' },
  { keyword: /物业|水电|燃气|自来水/, category: '居住', sub_category: '水电煤' },
  
  // 金融
  { keyword: /保险/, category: '金融', sub_category: '保险' },
  
  // 收入
  { keyword: /工资|月薪|奖金|薪资|有奖/, category: '收入', sub_category: '工资' },
  { keyword: /兼职|副业|稿费/, category: '收入', sub_category: '兼职' },
  { keyword: /退款|退货|售后/, category: '收入', sub_category: '退款' },
  
  // 社交
  { keyword: /红包/, category: '社交', sub_category: '红包' },
  { keyword: /转账/, category: '社交', sub_category: '转账' },
  { keyword: /聚餐|请客/, category: '社交', sub_category: '聚餐' },
  
  // 生活缴费
  { keyword: /生活缴费|水电煤|燃气|物业/, category: '居住', sub_category: '水电煤' },
  
  // 交通 - 公共交通
  { keyword: /公共交通|交通/, category: '交通', sub_category: '其他' },
  
  // 其他支出
  { keyword: /商户消费|扫码付款|扫二维码/, category: '其他', sub_category: '其他' },
]

export function categorize(
  description: string,
  counterparty?: string
): CategoryResult {
  const text = `${description || ''} ${counterparty || ''}`
  
  // 1. Check merchant map (highest priority)
  for (const [merchant, cat] of Object.entries(merchantMap)) {
    if (text.includes(merchant)) {
      return { ...cat, confidence: 0.9 }
    }
  }
  
  // 2. Check category rules
  for (const rule of categoryRules) {
    if (rule.keyword.test(text)) {
      return { category: rule.category, sub_category: rule.sub_category, confidence: 0.7 }
    }
  }
  
  // 3. Default category
  return { category: '其他', sub_category: '其他', confidence: 0.3 }
}