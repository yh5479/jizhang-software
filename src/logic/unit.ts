// 规格文本解析：把 "100抽×4包" / "500ml" / "1.5kg" / "5" 解析成「总基本单位数」与单位标签。

// 支持的中英文单位（越长越优先，避免 "克" 被 "g" 截断等问题）
const UNITS: string[] = [
  '毫克', '毫升', '千克',
  '抽', '张', '片', '包', '瓶', '盒', '份', '支', '卷', '条', '袋', '罐', '听', '块', '个', '双', '组', '件',
  'ml', 'g', 'kg', 'l', 'L',
];

// 构建「数字 + 可选单位」的匹配正则
const PAIR_REGEX = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${UNITS.join('|')})?`, 'gi');

export interface SpecParse {
  ok: boolean;
  numbers: number[]; // 提取到的所有数字（相乘得总单位）
  unit: string; // 第一个出现的单位；无单位时为 "份"
  totalUnits: number; // 数字连乘结果
  expression: string; // 用于预览，例如 "100抽 × 4"
  unitLabel: string; // "元/抽"
}

/**
 * 解析规格文本。
 * - "100抽×4包" -> numbers=[100,4], unit="抽", totalUnits=400, label="元/抽"
 * - "500ml"     -> numbers=[500],  unit="ml", totalUnits=500, label="元/ml"
 * - "1.5kg"     -> numbers=[1.5], unit="kg", totalUnits=1.5, label="元/kg"
 * - "5"         -> numbers=[5],    unit="份", totalUnits=5,   label="元/份"
 */
export function parseSpec(spec: string): SpecParse {
  const trimmed = (spec || '').trim();
  const numbers: number[] = [];
  const parts: string[] = [];
  let unit = '';
  let firstUnitFound = false;

  const re = new RegExp(PAIR_REGEX);
  let m: RegExpExecArray | null;
  while ((m = re.exec(trimmed)) !== null) {
    const num = parseFloat(m[1]);
    if (Number.isNaN(num)) continue;
    numbers.push(num);
    const u = m[2] ? m[2].toLowerCase() : '';
    if (u && !firstUnitFound) {
      unit = u;
      firstUnitFound = true;
    }
    parts.push(`${m[1]}${u}`);
  }

  // 没有任何数字：视为无效输入，但给一个安全的默认，避免除零
  if (numbers.length === 0) {
    return {
      ok: false,
      numbers: [],
      unit: '份',
      totalUnits: 1,
      expression: '',
      unitLabel: '元/份',
    };
  }

  if (!unit) unit = '份';
  const totalUnits = numbers.reduce((acc, n) => acc * n, 1);
  return {
    ok: true,
    numbers,
    unit,
    totalUnits,
    expression: parts.join(' × '),
    unitLabel: `元/${unit}`,
  };
}

/**
 * 生成「记一笔购买」表单里的实时换算预览文本。
 * 例如：￥39.9 ÷ (100抽 × 4) = ￥0.10 / 抽
 */
export function buildPreviewText(priceText: string, spec: string): string {
  const price = parseFloat(priceText);
  const parsed = parseSpec(spec);
  if (!parsed.ok && parsed.numbers.length === 0) {
    return spec.trim() ? '无法解析规格' : '输入规格后实时预览';
  }
  const expr = parsed.expression || `${parsed.totalUnits}`;
  if (Number.isNaN(price)) {
    return `？ ÷ (${expr}) = ？ / ${parsed.unit}`;
  }
  const unitPrice = price / parsed.totalUnits;
  return `￥${price.toFixed(2)} ÷ (${expr}) = ￥${unitPrice.toFixed(2)} / ${parsed.unit}`;
}
