#!/usr/bin/env python3
"""Builds resume.docx from resume/resume.html, so the editable copy can never drift from the PDF.

Word can't draw the PDF's black sheet, rounded posters or stickers, so this is the same resume on white paper:
the black head, the floors' colours as shaded cells, the same order and words. Static faces stand in for the
PDF's variable one (Oswald Bold for the heading face, Roboto for body and labels, Forum for the name), and are
embedded so the file looks the same on a machine without them. Their TTFs live in resume/fonts/ttf.

Needs python-docx: pip install python-docx
"""
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from docx.shared import Mm, Pt, RGBColor

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'resume' / 'resume.html'
OUTPUT = ROOT / 'resume.docx'
FONTS = ROOT / 'resume' / 'fonts' / 'ttf'

PALETTE = {'mint': '00C26E', 'tangerine': 'FF7A00', 'ultra': '2A1FFF', 'gold': 'FFC400', 'violet': '7B2FF2', 'pink': 'FF3D8B', 'red': 'FF2A00'}
BASE, PANEL = '0B0B0B', '171717'
DISPLAY, BODY, SERIF = 'Oswald', 'Roboto', 'Forum'
EMBED = {SERIF: {'Regular': 'Forum-Regular.ttf'}, DISPLAY: {'Bold': 'Oswald-Bold.ttf'}, BODY: {'Regular': 'Roboto-Regular.ttf', 'Bold': 'Roboto-Bold.ttf'}}


# Word refuses properties out of schema order, and python-docx only orders the ones it knows.
RPR_AFTER_SPACING = ('w:w', 'w:kern', 'w:position', 'w:sz', 'w:szCs', 'w:highlight', 'w:u', 'w:effect', 'w:bdr', 'w:shd',
                     'w:fitText', 'w:vertAlign', 'w:rtl', 'w:cs', 'w:em', 'w:lang', 'w:eastAsianLayout', 'w:specVanish', 'w:oMath')
PPR_AFTER_BORDER = ('w:shd', 'w:tabs', 'w:suppressAutoHyphens', 'w:kinsoku', 'w:wordWrap', 'w:overflowPunct', 'w:topLinePunct',
                    'w:autoSpaceDE', 'w:autoSpaceDN', 'w:bidi', 'w:adjustRightInd', 'w:snapToGrid', 'w:spacing', 'w:ind',
                    'w:contextualSpacing', 'w:mirrorIndents', 'w:suppressOverlap', 'w:jc', 'w:textDirection', 'w:textAlignment',
                    'w:textboxTightWrap', 'w:outlineLvl', 'w:divId', 'w:cnfStyle', 'w:rPr', 'w:sectPr', 'w:pPrChange')


# ------- Reading the page -------

def load():
    html = SOURCE.read_text(encoding='utf-8')
    body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
    return ET.fromstring('<body>' + body + '</body>')


def classes(el):
    return (el.get('class') or '').split()


def find(el, cls, tag='*'):
    return [e for e in el.iter(tag) if cls in classes(e)]


def text(el):
    return re.sub(r'\s+', ' ', ''.join(el.itertext())).strip()


def colours(el):
    """The poster colour and its ink, from the inline --c and --on-c the page sets."""
    style = el.get('style') or ''
    c = re.search(r'--c:var\(--(\w+)\)', style)
    ink = re.search(r'--on-c:#(\w+)', style)
    ink = ink.group(1).upper() if ink else 'FFFFFF'
    return PALETTE[c.group(1)] if c else BASE, ink * 2 if len(ink) == 3 and ink == ink[0] * 3 else ink


def upper(s):
    return s.upper()


# ------- Writing Word -------

def rgb(hexstr):
    return RGBColor.from_string(hexstr)


def run(p, s, font=BODY, size=8.5, bold=False, color='000000', caps=False, spacing=None):
    r = p.add_run(upper(s) if caps else s)
    r.font.name, r.font.size, r.font.bold, r.font.color.rgb = font, Pt(size), bold, rgb(color)
    r._element.rPr.rFonts.set(qn('w:hAnsi'), font)
    r._element.rPr.rFonts.set(qn('w:cs'), font)
    if spacing is not None:
        sp = OxmlElement('w:spacing')
        sp.set(qn('w:val'), str(spacing))
        r._element.rPr.insert_element_before(sp, *RPR_AFTER_SPACING)
    return r


def para(container, before=0, after=0, line=1.15, align=None):
    p = container.add_paragraph()
    f = p.paragraph_format
    f.space_before, f.space_after, f.line_spacing = Pt(before), Pt(after), line
    if align:
        p.alignment = align
    return p


def link(p, url, s, **kw):
    """A run inside a real hyperlink, which python-docx has no helper for."""
    rid = p.part.relate_to(url, RT.HYPERLINK, is_external=True)
    h = OxmlElement('w:hyperlink')
    h.set(qn('r:id'), rid)
    r = run(p, s, **kw)
    r.font.underline = False
    h.append(r._element)
    p._p.append(h)
    return r


def shade(cell, fill):
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill)
    cell._tc.get_or_add_tcPr().append(shd)


def margins(cell, top=3, right=3.5, bottom=3.5, left=3.5):
    mar = OxmlElement('w:tcMar')
    for side, mm in (('top', top), ('start', left), ('bottom', bottom), ('end', right)):
        e = OxmlElement(f'w:{side}')
        e.set(qn('w:w'), str(int(Mm(mm).twips)))
        e.set(qn('w:type'), 'dxa')
        mar.append(e)
    cell._tc.get_or_add_tcPr().append(mar)


def borders(table, **sides):
    """Clears every table border, then draws the ones asked for as (size in eighths of a point, colour)."""
    tblPr = table._tbl.tblPr
    b = OxmlElement('w:tblBorders')
    for side in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        e = OxmlElement(f'w:{side}')
        size, color = sides.get(side, (0, 'auto'))
        e.set(qn('w:val'), 'single' if size else 'nil')
        if size:
            e.set(qn('w:sz'), str(size))
            e.set(qn('w:color'), color)
        b.append(e)
    old = tblPr.find(qn('w:tblBorders'))
    if old is not None:
        tblPr.remove(old)
    tblPr.insert_element_before(b, 'w:shd', 'w:tblLayout', 'w:tblCellMar', 'w:tblLook', 'w:tblCaption', 'w:tblDescription')


def gap(table, size=12):
    """The site's hairline gap between posters, drawn as white rules inside the table so it keeps to the margin."""
    borders(table, insideH=(size, 'FFFFFF'), insideV=(size, 'FFFFFF'))


def table(doc, rows, cols, widths):
    t = doc.add_table(rows=rows, cols=cols)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    borders(t)
    for row in t.rows:
        for cell, w in zip(row.cells, widths):
            cell.width = Mm(w)
    return t


def first(cell):
    """A fresh cell holds one empty paragraph; use it rather than leaving a blank line on top."""
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    return p


def label(p, s, color, size=6.8):
    run(p, s, bold=True, size=size, color=color, caps=True, spacing=16)


def tags(cell, items, color, before=3):
    """The white tags, as Word can set them: tracked bold capitals, split by dots."""
    p = para(cell, before=before, line=1.25)
    for i, item in enumerate(items):
        if i:
            run(p, '  ·  ', bold=True, size=6.8, color=color)
        href = item.get('href')
        if href:
            # Underlined rather than arrowed: none of the embedded faces has an arrow, and Word would reach for an emoji.
            link(p, href, text(item), font=BODY, size=6.8, bold=True, color=color, caps=True, spacing=16).font.underline = True
        else:
            label(p, text(item), color)
    return p


def plus(cell, items, color, size=8.5):
    for li in items:
        p = para(cell, before=1.5, line=1.15)
        p.paragraph_format.left_indent = Mm(4)
        p.paragraph_format.first_line_indent = Mm(-4)
        run(p, '+\t', bold=True, size=size, color=color)
        p.paragraph_format.tab_stops.add_tab_stop(Mm(4))
        run(p, text(li), size=size, color=color)


def heading(doc, s, before=10, new_page=False):
    p = para(doc, before=0 if new_page else before, after=4, line=1.0)
    run(p, s, font=DISPLAY, size=19, bold=True, caps=True)
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.page_break_before = new_page


def section(doc, section, W, new_page=False):
    """One titled block: the projects, the prizes, the tool posters or the stairs."""
    heading(doc, text(find(section, 'kicker')[0]), new_page=new_page)

    for case in find(section, 'case', 'article'):
        fill, ink = colours(case)
        t = table(doc, 1, 2, [70, W - 70])
        side, main = t.cell(0, 0), t.cell(0, 1)
        for c in (side, main):
            shade(c, fill)
            margins(c, top=4, bottom=4.5, left=5 if c is side else 2, right=2 if c is side else 5)
        run(first(side), text(find(case, 'case-name')[0]), font=DISPLAY, size=22, bold=True, color=ink, caps=True)
        run(para(side, before=3, line=1.15), text(find(case, 'case-what')[0]), bold=True, size=8.8, color=ink)
        tags(side, find(find(find(case, 'case-side')[0], 'tags')[0], 'tag'), ink)
        for d in find(find(case, 'case-side')[0], 'case-desc', 'p'):
            run(para(side, before=4, line=1.2), text(d), color=ink)
        main_el = find(case, 'case-main')[0]
        p = first(main)
        label(p, text(find(main_el, 'label')[0]), ink)
        bottom = OxmlElement('w:pBdr')
        b = OxmlElement('w:bottom')
        for k, v in (('val', 'single'), ('sz', '8'), ('space', '3'), ('color', ink)):
            b.set(qn('w:' + k), v)
        bottom.append(b)
        p._p.get_or_add_pPr().insert_element_before(bottom, *PPR_AFTER_BORDER)
        for d in find(main_el, 'case-desc', 'p'):
            run(para(main, before=4, line=1.2), text(d), color=ink)
        plus(main, find(main_el, 'plus')[0].findall('li'), ink)
        tags(main, find(find(main_el, 'tags')[-1], 'tag'), ink, before=5)
        para(doc, after=0, line=0.6)

    prizes = find(section, 'prize')
    if prizes:
        t = table(doc, 1, len(prizes), [W / len(prizes)] * len(prizes))
        borders(t, top=(6, 'BFBFBF'))
        for cell, prize in zip(t.rows[0].cells, prizes):
            margins(cell, top=3, left=0, right=4, bottom=0)
            body = prize.find('div')
            parts = body.findall('p')
            run(first(cell), text(parts[0]), font=DISPLAY, size=14, bold=True, caps=True)
            run(para(cell, before=2, line=1.2), text(parts[1]))
            label(para(cell, before=2), text(parts[2]), '707070')

    posters = find(section, 'tool', 'div')
    if posters:
        t = table(doc, 2, 3, [W / 3] * 3)
        gap(t)
        for cell, tool in zip([c for r in t.rows for c in r.cells], posters):
            fill, ink = colours(tool)
            shade(cell, fill)
            margins(cell, top=3, right=3.5, bottom=3.5, left=3.5)
            run(first(cell), text(find(tool, 'd')[0]), font=DISPLAY, size=12, bold=True, color=ink, caps=True)
            tags(cell, find(tool, 'tag'), ink)

    steps = find(section, 'edu', 'div')
    if steps:
        t = table(doc, 1, len(steps), [W / len(steps)] * len(steps))
        gap(t)
        for cell, step in zip(t.rows[0].cells, steps):
            fill, ink = colours(step)
            shade(cell, fill)
            margins(cell, top=3, right=3.5, bottom=3.5, left=3.5)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            p = first(cell)
            kind = [e for e in step.findall('p') if 'label' in classes(e)]
            if kind:
                label(p, text(kind[0]), ink)
                p = para(cell, before=2)
            run(p, text(find(step, 'd')[0]), font=DISPLAY, size=10.5, bold=True, color=ink, caps=True)
            tags(cell, find(step, 'tag'), ink, before=5)


def duo(doc, block, W):
    """Competencies beside the panel about me, as on the PDF's second page."""
    left, right = block.findall('div')
    para(doc, before=6, line=0.6)  # Word merges two tables that touch.
    t = table(doc, 1, 2, [W - 64, 64])
    l, r = t.rows[0].cells
    margins(l, top=0, left=0, right=5, bottom=0)
    margins(r, top=0, left=0, right=0, bottom=0)
    p = first(l)
    run(p, text(find(left, 'kicker')[0]), font=DISPLAY, size=19, bold=True, caps=True)
    plus(l, find(left, 'plus')[0].findall('li'), '000000')
    p = first(r)
    run(p, text(find(right, 'kicker')[0]), font=DISPLAY, size=19, bold=True, caps=True)
    inner = r.add_table(rows=1, cols=1)
    borders(inner)
    panel = inner.cell(0, 0)
    panel.width = Mm(64)
    shade(panel, PANEL)
    margins(panel, top=3.5, right=4, bottom=4, left=4)
    for i, item in enumerate(find(right, 'about')[0].findall('div')):
        label(first(panel) if i == 0 else para(panel, before=4), text(item.find('dt')), 'A0A0A0')
        run(para(panel, before=1, line=1.2), text(item.find('dd')), color='FFFFFF')


# ------- The resume -------

def build():
    page = load()
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Mm(210), Mm(297)
    sec.left_margin = sec.right_margin = Mm(12)
    sec.top_margin = sec.bottom_margin = Mm(12)
    W = 186

    normal = doc.styles['Normal']
    normal.font.name, normal.font.size = BODY, Pt(8.5)
    normal.element.rPr.rFonts.set(qn('w:hAnsi'), BODY)
    normal.paragraph_format.space_after = Pt(0)
    doc.core_properties.title = 'Alexander Makedonskiy — Resume'
    doc.core_properties.author = 'Alexander Makedonskiy'

    # Head: the corner words, the name, the role, the links and the lede on one black block.
    head = find(page, 'head')[0]
    t = table(doc, 1, 1, [W])
    cell = t.cell(0, 0)
    shade(cell, BASE)
    margins(cell, top=5, right=6, bottom=6, left=6)
    corners = [text(e) for e in find(find(head, 'head-row')[0], 'd')]
    p = first(cell)
    p.paragraph_format.tab_stops.add_tab_stop(Mm(W - 12), alignment=2)
    run(p, corners[0] + '\t' + corners[1], font=DISPLAY, size=11, bold=True, color='FFFFFF', caps=True)
    run(para(cell, before=4, line=1.0, align=WD_ALIGN_PARAGRAPH.CENTER), text(find(head, 'word')[0]), font=SERIF, size=34, color='FFFFFF', caps=True)
    run(para(cell, before=8, line=1.0), text(find(find(head, 'role')[0], 'd')[0]), font=DISPLAY, size=24, bold=True, color='FFFFFF', caps=True)
    p = para(cell, before=7, line=1.3)
    for i, a in enumerate(find(head, 'btn', 'a')):
        if i:
            run(p, '   ', size=7.5)
        link(p, a.get('href'), text(a), size=7.5, bold=True, caps=True, spacing=8, color=PALETTE['gold'] if 'btn--gold' in classes(a) else 'FFFFFF')
    run(para(cell, before=7, line=1.3), text(find(head, 'lede')[0]), size=8.8, color='FFFFFF')

    # The two sheets' blocks in page order, the second sheet starting a new page as the PDF does.
    for index, sheet in enumerate(page.findall('section')):
        for number, block in enumerate(sheet):
            kind = classes(block)
            if 'section' in kind:
                section(doc, block, W, new_page=index > 0 and number == 0)
            elif 'duo' in kind:
                duo(doc, block, W)

    # The footer: the bars as a strip of the seven colours, then the legal line.
    para(doc, before=10)
    bars = find(page, 'bars')[0].findall('i')
    t = table(doc, 1, len(bars), [W / len(bars)] * len(bars))
    gap(t, 6)
    for cell, bar in zip(t.rows[0].cells, bars):
        shade(cell, PALETTE[re.search(r'--c:var\(--(\w+)\)', bar.get('style')).group(1)])
        run(first(cell), ' ', size=3)
    legal = [text(e) for e in find(page, 'foot-legal')[0]]
    p = para(doc, before=4)
    p.paragraph_format.tab_stops.add_tab_stop(Mm(W / 2), alignment=1)
    p.paragraph_format.tab_stops.add_tab_stop(Mm(W), alignment=2)
    run(p, legal[0] + '\t', size=7.5)
    link(p, 'https://www.amakedoni.com/', legal[1], size=7, bold=True, caps=True, spacing=16)
    run(p, '\t' + legal[2], size=7.5)

    doc.save(OUTPUT)
    embed_fonts()


def embed_fonts():
    """Packs the four faces into the file the way Google Docs does: whole TTFs under an all-zero key, which leaves them unobfuscated."""
    src = zipfile.ZipFile(OUTPUT)
    parts = {n: src.read(n) for n in src.namelist()}
    src.close()

    W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    rels, fonts, n = [], [], 0
    for name, styles in EMBED.items():
        embeds = ''
        for style, file in styles.items():
            n += 1
            parts[f'word/fonts/{file}'] = (FONTS / file).read_bytes()
            rels.append(f'<Relationship Id="rId{n}" Type="{R_NS}/font" Target="fonts/{file}"/>')
            embeds += f'<w:embed{style} w:fontKey="{{00000000-0000-0000-0000-000000000000}}" r:id="rId{n}" w:subsetted="0"/>'
        fonts.append(f'<w:font w:name="{name}"><w:charset w:val="CC"/><w:family w:val="auto"/>{embeds}</w:font>')
    parts['word/fontTable.xml'] = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:fonts xmlns:w="{W_NS}" xmlns:r="{R_NS}">' + ''.join(fonts) + '</w:fonts>').encode()
    parts['word/_rels/fontTable.xml.rels'] = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + ''.join(rels) + '</Relationships>').encode()

    # python-docx's template ships a stock thumbnail, which Finder would show instead of the resume.
    parts.pop('docProps/thumbnail.jpeg', None)
    parts['_rels/.rels'] = re.sub(rb'<Relationship [^>]*thumbnail[^>]*/>', b'', parts['_rels/.rels'])
    types = parts['[Content_Types].xml'].decode()
    types = re.sub(r'<Default Extension="jpeg"[^>]*/>', '', types) if not any(n.endswith('.jpeg') for n in parts) else types
    if 'Extension="ttf"' not in types:
        types = types.replace('<Default ', '<Default Extension="ttf" ContentType="application/x-font-ttf"/><Default ', 1)
    parts['[Content_Types].xml'] = types.encode()
    settings = parts['word/settings.xml'].decode()
    if 'embedTrueTypeFonts' not in settings:
        # After zoom and before everything that follows it in the schema.
        settings = re.sub(r'(<w:zoom[^>]*/>)', r'\1<w:embedTrueTypeFonts/>', settings, count=1)
        assert 'embedTrueTypeFonts' in settings, 'settings.xml has no zoom to anchor on'
    parts['word/settings.xml'] = settings.encode()
    doc_rels = parts['word/_rels/document.xml.rels'].decode()
    if 'fontTable' not in doc_rels:
        doc_rels = doc_rels.replace('</Relationships>', f'<Relationship Id="rIdFonts" Type="{R_NS}/fontTable" Target="fontTable.xml"/></Relationships>')
        parts['word/_rels/document.xml.rels'] = doc_rels.encode()
        types = parts['[Content_Types].xml'].decode()
        if '/word/fontTable.xml' not in types:
            types = types.replace('</Types>', '<Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/></Types>')
        parts['[Content_Types].xml'] = types.encode()

    with zipfile.ZipFile(OUTPUT, 'w', zipfile.ZIP_DEFLATED) as out:
        for name, data in parts.items():
            out.writestr(name, data)


if __name__ == '__main__':
    sys.exit(build())
