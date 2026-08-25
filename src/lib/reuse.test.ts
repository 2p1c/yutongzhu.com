import { describe, it, expect } from 'vitest'
import { splitParagraphs, computeReuse } from './reuse.js'

describe('splitParagraphs', () => {
  it('splits CRLF documents into paragraphs', () => {
    // 站点文章多为 CRLF 换行,段落间是 \r\n\r\n;必须能切分开,否则整篇会被当成单个段落。
    const text = '<div>\r\n\r\n![alt](./media/x.png)\r\n\r\n</div>\r\n'
    expect(splitParagraphs(text)).toEqual([
      '<div>',
      '![alt](./media/x.png)',
      '</div>',
    ])
  })

  it('splits LF documents into paragraphs', () => {
    expect(splitParagraphs('A\n\nB\n\nC')).toEqual(['A', 'B', 'C'])
  })

  it('drops empty segments', () => {
    expect(splitParagraphs('\n\nA\n\n\n\nB\n\n')).toEqual(['A', 'B'])
  })
})

describe('computeReuse', () => {
  // 旧文章与旧译文,用 CRLF 模拟磁盘上的真实格式。
  const oldContent = 'A\r\n\r\nB\r\n\r\nC'
  const oldContentEn = "A'\r\n\r\nB'\r\n\r\nC'"

  it('在旧文两段中间新增一段时,只重翻新段落,顺序跟随新文章', () => {
    const result = computeReuse(oldContent, oldContentEn, 'A\r\n\r\nB\r\n\r\nX\r\n\r\nC')
    expect(result.toTranslate).toEqual(['X'])
    expect(result.translations).toEqual(["A'", "B'", undefined, "C'"])
  })

  it('段落调序时全部复用,且按新顺序输出', () => {
    const result = computeReuse(oldContent, oldContentEn, 'C\r\n\r\nB\r\n\r\nA')
    expect(result.toTranslate).toEqual([])
    expect(result.translations).toEqual(["C'", "B'", "A'"])
  })

  it('删除段落时不额外翻译任何内容', () => {
    const result = computeReuse(oldContent, oldContentEn, 'A\r\n\r\nC')
    expect(result.toTranslate).toEqual([])
    expect(result.translations).toEqual(["A'", "C'"])
  })

  it('被修改的段落重翻,未改动的段落复用', () => {
    const result = computeReuse(oldContent, oldContentEn, 'A\r\n\r\nB-EDITED\r\n\r\nC')
    expect(result.toTranslate).toEqual(['B-EDITED'])
    expect(result.translations).toEqual(["A'", undefined, "C'"])
  })
})
