// 段落级增量翻译的纯函数模块:不依赖 OpenAI 客户端,便于单元测试。
// 核心思路:按「段落内容是否与旧文一致」决定复用旧译文还是重翻,
// 输出顺序始终跟随最新修改后的文章顺序。这样在旧文段落中间新增/删除/调序时,
// 只有真正变化的内容会被重新翻译。

export interface ReuseResult {
  // 按新文章顺序排列的译文;未命中旧译文的段落位置为 undefined(待翻)。
  translations: (string | undefined)[]
  // 需要翻译的新段落(按出现顺序)。
  toTranslate: string[]
  // 旧中文段落,作为增量翻译时供模型参考的术语上下文。
  contextParagraphs: string[]
}

// 统一换行符:CRLF(Windows)、CR(旧 Mac)都归一为 LF。
// 否则段落之间的 \r\n\r\n 会让 \n{2,} 的空行切分失效,整篇被误判为单个段落。
function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, '\n')
}

export function splitParagraphs(text: string): string[] {
  return normalizeLineEndings(text)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

function buildReuseMap(oldContent: string, oldContentEn: string): Map<string, string> {
  const oldZh = splitParagraphs(oldContent)
  const oldEn = splitParagraphs(oldContentEn)
  const map = new Map<string, string>()
  for (let i = 0; i < oldZh.length && i < oldEn.length; i++) {
    map.set(oldZh[i], oldEn[i])
  }
  return map
}

// 计算增量翻译的复用方案:能复用的段落取旧译文,变化的段落标记待翻。
export function computeReuse(
  oldContent: string,
  oldContentEn: string,
  newContent: string,
): ReuseResult {
  const reuseMap = buildReuseMap(oldContent, oldContentEn)
  const newParas = splitParagraphs(newContent)
  const translations: (string | undefined)[] = newParas.map((p) => reuseMap.get(p))
  const toTranslate: string[] = []
  for (let i = 0; i < newParas.length; i++) {
    if (translations[i] === undefined) toTranslate.push(newParas[i])
  }
  return { translations, toTranslate, contextParagraphs: [...reuseMap.keys()] }
}
