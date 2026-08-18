import OpenAI from 'openai'
import { getPostBySlug, saveTranslation } from './post-storage.js'

// 通用的大模型配置：一个 Model 就是一个 OpenAI 兼容端点 + 模型名。
// 换服务商只需改 .env 里的三个 TRANSLATE_* 变量。
export interface Model {
  baseUrl: string
  apiKey: string
  model: string
}

const model: Model = {
  baseUrl: process.env.TRANSLATE_BASE_URL ?? '',
  apiKey: process.env.TRANSLATE_API_KEY ?? '',
  model: process.env.TRANSLATE_MODEL ?? '',
}

const client = new OpenAI({ baseURL: model.baseUrl, apiKey: model.apiKey })

function splitParagraphs(text: string): string[] {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 0)
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

// 翻译系统提示词（即「Agent 接口」）。json_object 模式要求提示词里出现「JSON」字样，已满足。
const SYSTEM_PROMPT = `你是一名翻译专家，负责把中文 Markdown 博文翻译成自然、地道的英文。翻译需达到「信达雅」标准：「信」即忠实于原文的内容与意图；「达」即译文通顺易懂、表达清晰；「雅」即追求译文的文化审美和语言优美。目标是创作出既忠于原作精神、又符合目标语言文化和读者审美的译文，可调整语气和风格，并考虑某些词语的文化内涵和地区差异。

规则：
1. 完整保留 Markdown 结构：标题、列表、代码块、链接、图片、引用、图注等语法原样保留。
2. 代码块（由三个反引号包裹的内容）里的代码一律不翻译。
3. URL、文件名、图片路径、邮箱、变量名、命令行等一律不翻译，原样保留。
4. 保留行内 Markdown（加粗、斜体、链接、图片语法）。
5. 图片说明（alt 文本 / 图注）需要翻译。
6. 缩写、方法名、人名等视情况可不翻译。
7. 注意上下文中相同名词翻译的一致性。

只输出一个 JSON 对象，不要 Markdown 代码围栏，不要输出任何解释文字，格式：
{"titleEn": "英文标题", "contentEn": "英文 Markdown 正文"}`

async function translatePost(
  title: string,
  content: string,
): Promise<{ titleEn: string; contentEn: string }> {
  const completion = await client.chat.completions.create({
    model: model.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `标题：\n${title}\n\n正文：\n${content}` },
    ],
    response_format: { type: 'json_object' },
  })
  return JSON.parse(completion.choices[0].message.content ?? '') as {
    titleEn: string
    contentEn: string
  }
}

// 增量翻译：只翻译变更段落，`contextParagraphs` 作为术语一致的参考上下文。
async function translateParagraphs(
  paragraphs: string[],
  contextParagraphs: string[],
): Promise<string[]> {
  const ctx =
    contextParagraphs.length > 0
      ? `以下是同一篇文章中未改动的段落，仅供术语参考，不要翻译：\n${contextParagraphs
          .map((p) => `[CTX] ${p}`)
          .join('\n\n')}\n\n`
      : ''
  const userContent =
    `${ctx}请按顺序把以下段落翻译成英文，保持 Markdown 结构、代码块、URL、图片语法原样：\n${paragraphs
      .map((p, i) => `[T${i + 1}] ${p}`)
      .join('\n\n')}\n\n只输出 JSON：{"translations": ["...", "..."]}`
  const completion = await client.chat.completions.create({
    model: model.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
  })
  return (JSON.parse(completion.choices[0].message.content ?? '') as {
    translations: string[]
  }).translations
}

export async function translateAndSave(
  slug: string,
  title: string,
  content: string,
): Promise<void> {
  const existing = await getPostBySlug(slug)

  if (!existing?.contentEn || existing.title !== title) {
    const { titleEn, contentEn } = await translatePost(title, content)
    await saveTranslation(slug, titleEn, contentEn)
    return
  }

  const reuseMap = buildReuseMap(existing.content, existing.contentEn)
  const newParas = splitParagraphs(content)
  const translations: (string | undefined)[] = newParas.map((p) => reuseMap.get(p))
  const toTranslate: string[] = []
  for (let i = 0; i < newParas.length; i++) {
    if (translations[i] === undefined) toTranslate.push(newParas[i])
  }

  if (toTranslate.length === 0) return

  const newTranslations = await translateParagraphs(toTranslate, [...reuseMap.keys()])
  let j = 0
  for (let i = 0; i < translations.length; i++) {
    if (translations[i] === undefined) translations[i] = newTranslations[j++]
  }

  // existing.contentEn 存在 ⇒ existing.titleEn 由 saveTranslation 同步写入，必存在。
  await saveTranslation(slug, existing.titleEn!, translations.join('\n\n'))
}
