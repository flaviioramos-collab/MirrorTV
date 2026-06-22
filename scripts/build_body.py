#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MirrorTV — Quickstart PWA → APK
Gera o corpo do PDF (sem capa) que depois é mesclado com a capa HTML/Playwright.
"""

import os
import sys
import hashlib
import platform

# Permite importar helpers do skill PDF (install_font_fallback)
PDF_SKILL_DIR = "/home/z/my-project/skills/pdf"
sys.path.insert(0, os.path.join(PDF_SKILL_DIR, "scripts"))

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    KeepTogether,
    CondPageBreak,
    HRFlowable,
    Preformatted,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from PIL import Image as PILImage

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Font registration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_IS_MAC = platform.system() == "Darwin"
FONT_DIR = os.path.expanduser("~/.openclaw/workspace/fonts") if _IS_MAC else "/usr/share/fonts"

pdfmetrics.registerFont(TTFont("NotoSerifSC", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf"))
pdfmetrics.registerFont(TTFont("NotoSerifSC-Bold", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf"))
# NotoSansSC is a variable font — use the static SarasaMonoSC instead for sans-serif fallback
pdfmetrics.registerFont(TTFont("SarasaMonoSC", f"{FONT_DIR}/truetype/chinese/SarasaMonoSC-Regular.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif", f"{FONT_DIR}/truetype/freefont/FreeSerif.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Bold", f"{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Italic", f"{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-BoldItalic", f"{FONT_DIR}/truetype/freefont/FreeSerifBoldItalic.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSans", f"{FONT_DIR}/truetype/dejavu/DejaVuSansMono.ttf"))

registerFontFamily("NotoSerifSC", normal="NotoSerifSC", bold="NotoSerifSC-Bold")
registerFontFamily(
    "FreeSerif",
    normal="FreeSerif",
    bold="FreeSerif-Bold",
    italic="FreeSerif-Italic",
    boldItalic="FreeSerif-BoldItalic",
)
registerFontFamily("DejaVuSans", normal="DejaVuSans", bold="DejaVuSans")

from pdf import install_font_fallback  # noqa: E402
install_font_fallback()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Palette (cascade output)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE_BG       = colors.HexColor('#f4f5f5')
SECTION_BG    = colors.HexColor('#f0f1f2')
CARD_BG       = colors.HexColor('#e8eaeb')
TABLE_STRIPE  = colors.HexColor('#ebeded')
HEADER_FILL   = colors.HexColor('#32454e')
COVER_BLOCK   = colors.HexColor('#566a74')
BORDER        = colors.HexColor('#acbdc5')
ICON          = colors.HexColor('#4b86a4')
ACCENT        = colors.HexColor('#1f6c92')
ACCENT_2      = colors.HexColor('#c23a50')
TEXT_PRIMARY  = colors.HexColor('#131515')
TEXT_MUTED    = colors.HexColor('#747b7e')
SEM_SUCCESS   = colors.HexColor('#529067')
SEM_WARNING   = colors.HexColor('#8c7443')
SEM_ERROR     = colors.HexColor('#a25b54')
SEM_INFO      = colors.HexColor('#507aa4')

TABLE_HEADER_COLOR = HEADER_FILL
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = TABLE_STRIPE

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Layout constants
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEFT_MARGIN   = 0.85 * inch
RIGHT_MARGIN  = 0.85 * inch
TOP_MARGIN    = 0.9 * inch
BOTTOM_MARGIN = 0.9 * inch
AVAILABLE_W   = A4[0] - LEFT_MARGIN - RIGHT_MARGIN  # ~428pt

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Styles
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
H1 = ParagraphStyle(
    name="H1", fontName="FreeSerif-Bold", fontSize=22, leading=28,
    textColor=TEXT_PRIMARY, spaceBefore=8, spaceAfter=12, alignment=TA_LEFT,
)
H2 = ParagraphStyle(
    name="H2", fontName="FreeSerif-Bold", fontSize=15, leading=20,
    textColor=HEADER_FILL, spaceBefore=14, spaceAfter=8, alignment=TA_LEFT,
)
H3 = ParagraphStyle(
    name="H3", fontName="FreeSerif-Bold", fontSize=12, leading=16,
    textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6, alignment=TA_LEFT,
)
BODY = ParagraphStyle(
    name="Body", fontName="FreeSerif", fontSize=10.5, leading=16,
    textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceBefore=0, spaceAfter=8,
)
BODY_LEFT = ParagraphStyle(
    name="BodyLeft", parent=BODY, alignment=TA_LEFT,
)
KICKER = ParagraphStyle(
    name="Kicker", fontName="FreeSerif-Bold", fontSize=9, leading=12,
    textColor=ACCENT, alignment=TA_LEFT, spaceBefore=0, spaceAfter=4,
)
MUTED = ParagraphStyle(
    name="Muted", fontName="FreeSerif-Italic", fontSize=9.5, leading=13,
    textColor=TEXT_MUTED, alignment=TA_LEFT,
)
CODE = ParagraphStyle(
    name="Code", fontName="DejaVuSans", fontSize=8.5, leading=12,
    textColor=TEXT_PRIMARY, backColor=CARD_BG, alignment=TA_LEFT,
    leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=8,
    borderColor=BORDER, borderWidth=0.5, borderPadding=8,
)
CAPTION = ParagraphStyle(
    name="Caption", fontName="FreeSerif-Italic", fontSize=9, leading=12,
    textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=4, spaceAfter=10,
)
TABLE_HEADER_STYLE = ParagraphStyle(
    name="TableHeader", fontName="FreeSerif-Bold", fontSize=10, leading=13,
    textColor=colors.white, alignment=TA_CENTER,
)
TABLE_CELL_STYLE = ParagraphStyle(
    name="TableCell", fontName="FreeSerif", fontSize=9.5, leading=13,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)
TABLE_CELL_CENTER = ParagraphStyle(
    name="TableCellC", parent=TABLE_CELL_STYLE, alignment=TA_CENTER,
)
CALLOUT_TITLE = ParagraphStyle(
    name="CalloutTitle", fontName="FreeSerif-Bold", fontSize=10.5, leading=14,
    textColor=ACCENT, alignment=TA_LEFT, spaceAfter=4,
)
CALLOUT_BODY = ParagraphStyle(
    name="CalloutBody", fontName="FreeSerif", fontSize=10, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)
STEP_NUM = ParagraphStyle(
    name="StepNum", fontName="FreeSerif-Bold", fontSize=14, leading=18,
    textColor=colors.white, alignment=TA_CENTER,
)
STEP_TITLE = ParagraphStyle(
    name="StepTitle", fontName="FreeSerif-Bold", fontSize=11.5, leading=15,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)
STEP_BODY = ParagraphStyle(
    name="StepBody", fontName="FreeSerif", fontSize=10, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Helpers
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def add_heading(text, style, level=0, story=None):
    key = "h_" + hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    if story is not None:
        story.append(p)
    return p


def h1(text, story, level=0):
    """H1 with accent underline rule."""
    add_heading(text, H1, level=level, story=story)
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT,
                            spaceBefore=0, spaceAfter=14))


def h2(text, story):
    add_heading(text, H2, level=1, story=story)


def h3(text, story):
    add_heading(text, H3, level=2, story=story)


def p(text, story, style=None):
    story.append(Paragraph(text, style or BODY))


def code_block(text, story, lang_label=None):
    """Render a code block with a small language label above it."""
    if lang_label:
        story.append(Paragraph(
            '<font color="#747b7e" size="8">%s</font>' % lang_label.upper(),
            ParagraphStyle("codeLabel", parent=BODY, fontSize=8, leading=10,
                           spaceBefore=10, spaceAfter=2, alignment=TA_LEFT)
        ))
    story.append(Preformatted(text, CODE))


def callout(title, body_html, story, kind="info"):
    """Tinted callout box with accent left border."""
    color_map = {
        "info":    (SEM_INFO,    colors.HexColor("#eaf1f7")),
        "success": (SEM_SUCCESS, colors.HexColor("#e9f3ec")),
        "warning": (SEM_WARNING, colors.HexColor("#f5efe2")),
        "error":   (SEM_ERROR,   colors.HexColor("#f5e9e8")),
    }
    bar_color, bg = color_map.get(kind, color_map["info"])
    inner = [
        Paragraph(title, CALLOUT_TITLE),
        Paragraph(body_html, CALLOUT_BODY),
    ]
    inner_table = Table([[inner]], colWidths=[AVAILABLE_W - 16])
    inner_table.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 4, bar_color),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(Spacer(1, 6))
    story.append(inner_table)
    story.append(Spacer(1, 12))


def numbered_step(num, title, body_html, story, code=None, lang=None):
    """Render a numbered step with circular badge."""
    badge = Table([[Paragraph(str(num), STEP_NUM)]], colWidths=[28], rowHeights=[28])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    inner_right = [
        Paragraph(title, STEP_TITLE),
        Spacer(1, 4),
        Paragraph(body_html, STEP_BODY),
    ]
    if code:
        if lang:
            inner_right.append(Paragraph(
                '<font color="#747b7e" size="8">%s</font>' % lang.upper(),
                ParagraphStyle("cl", parent=BODY, fontSize=8, leading=10,
                               spaceBefore=6, spaceAfter=2)
            ))
        inner_right.append(Preformatted(code, CODE))
    row = Table(
        [[badge, inner_right]],
        colWidths=[44, AVAILABLE_W - 44],
    )
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING", (1, 0), (1, 0), 12),
    ]))
    story.append(Spacer(1, 8))
    story.append(KeepTogether(row))
    story.append(Spacer(1, 4))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Header / footer
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def on_page(canvas, doc):
    canvas.saveState()
    # Header
    canvas.setFont("FreeSerif", 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(LEFT_MARGIN, A4[1] - 36,
                      "MirrorTV · Quickstart PWA para APK")
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(0.8)
    canvas.line(LEFT_MARGIN, A4[1] - 42,
                A4[0] - RIGHT_MARGIN, A4[1] - 42)
    # Footer
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(LEFT_MARGIN, 48,
                A4[0] - RIGHT_MARGIN, 48)
    canvas.setFont("FreeSerif", 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(LEFT_MARGIN, 34, "Z.ai · MirrorTV Docs")
    page_num = canvas.getPageNumber() + 1  # +1 because cover is page 1
    canvas.drawRightString(A4[0] - RIGHT_MARGIN, 34,
                           "Página %d" % page_num)
    canvas.restoreState()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Build story
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def build_story():
    story = []

    # ── Chapter 1: Visão Geral ────────────────────────────────────────
    h1("1. Visão Geral", story)
    p(
        "Converter uma <b>PWA</b> (Progressive Web App) em um <b>APK</b> "
        "(Android Package) significa pegar o app MirrorTV que roda no navegador "
        "e empacotá-lo como um aplicativo nativo Android, instalável diretamente "
        "pelo arquivo <font name='DejaVuSans'>.apk</font> e distribuível fora da "
        "Play Store. O Android suporta esse fluxo através de uma tecnologia "
        "chamada <b>TWA (Trusted Web Activity)</b>, que abre a PWA em uma WebView "
        "de tela cheia, sem a barra de endereço do Chrome, mas herdando todos os "
        "recursos do navegador — incluindo o <i>getDisplayMedia</i> usado pelo "
        "MirrorTV para capturar a tela.",
        story,
    )
    p(
        "Existem três caminhos para chegar ao APK, todos legítimos e gratuitos. "
        "Este guia compara os três e depois detalha o <b>método recomendado para "
        "90% dos casos</b>: publicar a PWA na Vercel e empacotar com o "
        "<b>PWABuilder</b>. Você não precisa instalar Android Studio nem "
        "escrever uma linha de Java/Kotlin — o tempo total do início ao fim é "
        "inferior a 30 minutos.",
        story,
    )

    h2("Pré-requisitos", story)
    pre_data = [
        [Paragraph("<b>Recurso</b>", TABLE_HEADER_STYLE),
         Paragraph("<b>Por quê</b>", TABLE_HEADER_STYLE),
         Paragraph("<b>Versão mínima</b>", TABLE_HEADER_STYLE)],
        [Paragraph("Computador com Chrome", TABLE_CELL_STYLE),
         Paragraph("PWABuilder exige Chrome desktop para análise", TABLE_CELL_STYLE),
         Paragraph("Chrome 110+", TABLE_CELL_CENTER)],
        [Paragraph("Conta GitHub", TABLE_CELL_STYLE),
         Paragraph("Vercel deploya a partir de um repositório Git", TABLE_CELL_STYLE),
         Paragraph("Gratuita", TABLE_CELL_CENTER)],
        [Paragraph("Conta Vercel", TABLE_CELL_STYLE),
         Paragraph("Hospedagem HTTPS gratuita para a PWA", TABLE_CELL_STYLE),
         Paragraph("Gratuita (Hobby)", TABLE_CELL_CENTER)],
        [Paragraph("Node.js + Bun (opcional)", TABLE_CELL_STYLE),
         Paragraph("Apenas se for rodar o projeto localmente antes do deploy", TABLE_CELL_STYLE),
         Paragraph("Node 20+, Bun 1.3+", TABLE_CELL_CENTER)],
        [Paragraph("Celular Android para teste", TABLE_CELL_STYLE),
         Paragraph("Onde instalar e validar o APK gerado", TABLE_CELL_STYLE),
         Paragraph("Android 9 (API 28)+", TABLE_CELL_CENTER)],
    ]
    pre_widths = [
        AVAILABLE_W * 0.30,
        AVAILABLE_W * 0.50,
        AVAILABLE_W * 0.20,
    ]
    pre_table = Table(pre_data, colWidths=pre_widths, hAlign="CENTER",
                      repeatRows=1)
    pre_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_FILL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(Spacer(1, 10))
    story.append(pre_table)
    story.append(Paragraph("Tabela 1 — Pré-requisitos do quickstart", CAPTION))

    story.append(PageBreak())

    # ── Chapter 2: Comparação dos 3 métodos ──────────────────────────
    h1("2. Comparação dos 3 Métodos", story)
    p(
        "Todos os três métodos chegam ao mesmo resultado — um APK baseado em "
        "TWA que abre a sua PWA em tela cheia. A diferença está no <b>esforço</b>, "
        "no <b>controle</b> e na <b>automação</b>. A tabela abaixo resume quando "
        "usar cada um; em seguida, três callouts destacam os prós e contras.",
        story,
    )

    h2("Tabela comparativa", story)
    cmp_data = [
        [Paragraph("<b>Critério</b>", TABLE_HEADER_STYLE),
         Paragraph("<b>PWABuilder</b>", TABLE_HEADER_STYLE),
         Paragraph("<b>Bubblewrap CLI</b>", TABLE_HEADER_STYLE),
         Paragraph("<b>Android Studio TWA</b>", TABLE_HEADER_STYLE)],
        [Paragraph("<b>Dificuldade</b>", TABLE_CELL_STYLE),
         Paragraph("Muito fácil", TABLE_CELL_CENTER),
         Paragraph("Intermediária", TABLE_CELL_CENTER),
         Paragraph("Avançada", TABLE_CELL_CENTER)],
        [Paragraph("<b>Tempo até APK</b>", TABLE_CELL_STYLE),
         Paragraph("5 min", TABLE_CELL_CENTER),
         Paragraph("15 min", TABLE_CELL_CENTER),
         Paragraph("45 min+", TABLE_CELL_CENTER)],
        [Paragraph("<b>Instalação no PC</b>", TABLE_CELL_STYLE),
         Paragraph("Nenhuma (web)", TABLE_CELL_CENTER),
         Paragraph("Node + Bubblewrap", TABLE_CELL_CENTER),
         Paragraph("Android Studio (~3 GB)", TABLE_CELL_CENTER)],
        [Paragraph("<b>Customização</b>", TABLE_CELL_STYLE),
         Paragraph("Básica (ícone, cor)", TABLE_CELL_CENTER),
         Paragraph("Média (manifest, build.gradle)", TABLE_CELL_CENTER),
         Paragraph("Total (código nativo)", TABLE_CELL_CENTER)],
        [Paragraph("<b>Assinatura do APK</b>", TABLE_CELL_STYLE),
         Paragraph("Automática (debug)", TABLE_CELL_CENTER),
         Paragraph("Configurável (keystore)", TABLE_CELL_CENTER),
         Paragraph("Manual (Android Studio)", TABLE_CELL_CENTER)],
        [Paragraph("<b>Melhor para</b>", TABLE_CELL_STYLE),
         Paragraph("Primeiro APK, prova de conceito", TABLE_CELL_STYLE),
         Paragraph("Recompilar a cada release", TABLE_CELL_STYLE),
         Paragraph("Adicionar código nativo", TABLE_CELL_STYLE)],
        [Paragraph("<b>Play Store (AAB)</b>", TABLE_CELL_STYLE),
         Paragraph("Sim, gera AAB", TABLE_CELL_CENTER),
         Paragraph("Sim, gera AAB", TABLE_CELL_CENTER),
         Paragraph("Sim, gera AAB", TABLE_CELL_CENTER)],
    ]
    cmp_widths = [
        AVAILABLE_W * 0.22,
        AVAILABLE_W * 0.26,
        AVAILABLE_W * 0.26,
        AVAILABLE_W * 0.26,
    ]
    cmp_table = Table(cmp_data, colWidths=cmp_widths, hAlign="CENTER",
                      repeatRows=1)
    cmp_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_FILL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(Spacer(1, 8))
    story.append(cmp_table)
    story.append(Paragraph("Tabela 2 — Comparação dos três métodos de empacotamento", CAPTION))

    h2("Prós e contras em detalhe", story)

    callout(
        "PWABuilder — o caminho mais curto",
        "Prós: tudo acontece no navegador, sem instalar SDK; gera APK e AAB "
        "prontos; integração direta com a Play Store. Contras: pouca "
        "customização visual além do ícone e cor de splash; assinatura de "
        "produção precisa ser gerada manualmente uma vez (upload de keystore). "
        "<b>Recomendado para 90% dos casos.</b>",
        story, kind="success",
    )

    callout(
        "Bubblewrap CLI — para quem recompila sempre",
        "Prós: roda local, integra com CI/CD (GitHub Actions), permite "
        "ajustar <font name='DejaVuSans'>build.gradle</font> e "
        "<font name='DejaVuSans'>twamanifest.json</font>. Contras: exige Node "
        "16+ e JDK 11+; primeira configuração demora ~15 min; curva de "
        "aprendizado da CLI. Ideal depois que você já validou o APK pelo "
        "PWABuilder e quer automatizar releases.",
        story, kind="info",
    )

    callout(
        "Android Studio + TWA — máximo controle",
        "Prós: abre o projeto Android completo, permite adicionar código "
        "nativo (permissões, intents, plugins), editar layouts XML. Contras: "
        "download de ~3 GB, JDK configurado, tempo de build elevado; só vale "
        "a pena se a PWA precisar de APIs que o TWA não expõe por padrão "
        "(raro). <b>Pule este método</b> a menos que tenha um motivo concreto.",
        story, kind="warning",
    )

    p(
        "<b>Decisão:</b> este guia detalha o <b>PWABuilder</b> a partir da "
        "próxima seção. Se depois você quiser migrar para Bubblewrap, o "
        "comando <font name='DejaVuSans'>bubblewrap init --manifest "
        "https://sua-url/manifest.json</font> reaproveita o mesmo "
        "<font name='DejaVuSans'>manifest.json</font> da PWA — a migração é "
        "direta, sem retrabalho.",
        story,
    )

    story.append(PageBreak())

    # ── Chapter 3: Passo 1 — Vercel ───────────────────────────────────
    h1("3. Passo 1 — Publicar a PWA na Vercel", story)
    p(
        "O PWABuilder precisa de uma <b>URL pública com HTTPS</b> para analisar "
        "a PWA e gerar o APK. A Vercel é a forma mais rápida de publicar um "
        "projeto Next.js: em poucos cliques você tem um endereço como "
        "<font name='DejaVuSans'>https://mirrortv.vercel.app</font> com HTTPS "
        "automático, CDN global e renovação de certificado gerenciada.",
        story,
    )

    numbered_step(
        1, "Suba o projeto MirrorTV para o GitHub",
        "Crie um repositório no GitHub (público ou privado, tanto faz) e faça "
        "push do projeto Next.js. Inclua o arquivo "
        "<font name='DejaVuSans'>package.json</font>, a pasta "
        "<font name='DejaVuSans'>src/</font>, "
        "<font name='DejaVuSans'>public/</font> e "
        "<font name='DejaVuSans'>next.config.ts</font>. Não suba "
        "<font name='DejaVuSans'>node_modules/</font> nem "
        "<font name='DejaVuSans'>.next/</font> — o arquivo "
        "<font name='DejaVuSans'>.gitignore</font> do scaffold já cobre isso.",
        story,
        code=(
            "# No diretório do projeto\n"
            "git init\n"
            "git add .\n"
            "git commit -m \"MirrorTV PWA inicial\"\n"
            "git branch -M main\n"
            "git remote add origin https://github.com/SEU_USUARIO/mirrortv.git\n"
            "git push -u origin main"
        ),
        lang="bash",
    )

    numbered_step(
        2, "Conecte a Vercel ao repositório",
        "Acesse <font name='DejaVuSans'>vercel.com/new</font>, faça login com "
        "o GitHub e clique em <b>Import Project</b> no repositório "
        "<font name='DejaVuSans'>mirrortv</font>. A Vercel detecta Next.js "
        "automaticamente e preenche <b>Build Command</b> "
        "(<font name='DejaVuSans'>next build</font>) e <b>Output Directory</b> "
        "(<font name='DejaVuSans'>.next</font>) sem intervenção.",
        story,
    )

    numbered_step(
        3, "Configure as variáveis de ambiente (se houver)",
        "Se o projeto usa variáveis de ambiente (chaves de API, endpoints de "
        "mini-services), adicione em <b>Settings → Environment Variables</b>. "
        "Para o MirrorTV não há segredos obrigatórios — o serviço de "
        "signaling e o DLNA rodam em mini-services à parte, que você pode "
        "subir no Railway, Fly.io ou outra VPS.",
        story,
    )

    numbered_step(
        4, "Deploy e obtenha a URL pública",
        "Clique em <b>Deploy</b>. Em 60–90 segundos a Vercel publica o projeto "
        "e retorna a URL <font name='DejaVuSans'>https://mirrortv.vercel.app</font> "
        "(ou o nome que você escolheu). Abra a URL no Chrome desktop para "
        "confirmar que o app carrega, que o ícone aparece na aba e que o "
        "Chrome exibe o ícone de instalação na barra de endereço — sinal de "
        "que a PWA está válida.",
        story,
        code=(
            "# Validação rápida da PWA via CLI (opcional)\n"
            "npx pwa-asset-generator --manifest \\\n"
            "  https://mirrortv.vercel.app/manifest.json\n"
            "\n"
            "# Ou use o Lighthouse no Chrome DevTools\n"
            "# Abra a URL → F12 → Lighthouse → Generate report\n"
            "# Score PWA deve ser >= 90"
        ),
        lang="bash",
    )

    callout(
        "Por que HTTPS é obrigatório?",
        "As APIs de captura de tela (<font name='DejaVuSans'>getDisplayMedia</font>), "
        "Service Worker e instalação de PWA só funcionam em HTTPS (ou em "
        "<font name='DejaVuSans'>localhost</font> para desenvolvimento). Sem "
        "HTTPS, o PWABuilder rejeita a URL e o APK gerado não consegue "
        "capturar a tela. A Vercel resolve isso automaticamente — você não "
        "precisa configurar certificados.",
        story, kind="info",
    )

    story.append(PageBreak())

    # ── Chapter 4: Passo 2 — PWABuilder ───────────────────────────────
    h1("4. Passo 2 — Gerar o APK no PWABuilder", story)
    p(
        "O <b>PWABuilder</b> é uma ferramenta online da Microsoft que analisa "
        "a PWA, valida o <font name='DejaVuSans'>manifest.json</font>, gera "
        "ícones faltantes e empacota tudo em um APK/AAB assinável. Não pede "
        "login, não cobra nada e funciona em qualquer navegador Chromium.",
        story,
    )

    numbered_step(
        1, "Abra pwabuilder.com no Chrome desktop",
        "Acesse <font name='DejaVuSans'>https://www.pwabuilder.com</font>. "
        "Use Chrome, Edge ou Brave — Firefox e Safari não têm suporte "
        "completo às APIs de empacotamento que o site usa internamente.",
        story,
    )

    numbered_step(
        2, "Cole a URL da Vercel e analise",
        "Na caixa central, cole <font name='DejaVuSans'>https://mirrortv.vercel.app</font> "
        "e clique em <b>Start</b>. O PWABuilder baixa a PWA, valida o "
        "manifest, os service workers e os ícones. Em 30 segundos você "
        "recebe um <b>score</b> (procure ficar acima de 90) e uma lista de "
        "melhorias opcionais. Se algo crítico faltar (ícone 512×512, "
        "start_url, display: standalone), ele aponta exatamente o que "
        "corrigir no <font name='DejaVuSans'>manifest.json</font>.",
        story,
    )

    numbered_step(
        3, "Package For Stores → Android",
        "No painel de resultado, clique em <b>Package For Stores</b> e "
        "selecione <b>Android</b>. Um formulário pede seis campos. Preencha "
        "conforme a tabela abaixo e clique em <b>Generate</b>.",
        story,
    )

    pkg_data = [
        [Paragraph("<b>Campo</b>", TABLE_HEADER_STYLE),
         Paragraph("<b>Exemplo / valor recomendado</b>", TABLE_HEADER_STYLE),
         Paragraph("<b>Observação</b>", TABLE_HEADER_STYLE)],
        [Paragraph("Package ID", TABLE_CELL_STYLE),
         Paragraph("com.seunome.mirrortv", TABLE_CELL_STYLE),
         Paragraph("Único global; reverse-domain", TABLE_CELL_STYLE)],
        [Paragraph("App name", TABLE_CELL_STYLE),
         Paragraph("MirrorTV", TABLE_CELL_STYLE),
         Paragraph("Aparece sob o ícone no launcher", TABLE_CELL_STYLE)],
        [Paragraph("Launcher name", TABLE_CELL_STYLE),
         Paragraph("MirrorTV", TABLE_CELL_STYLE),
         Paragraph("Versão curta (≤ 12 chars)", TABLE_CELL_STYLE)],
        [Paragraph("App version", TABLE_CELL_STYLE),
         Paragraph("1.0.0", TABLE_CELL_STYLE),
         Paragraph("Semântico (maior.minor.patch)", TABLE_CELL_STYLE)],
        [Paragraph("Signing key", TABLE_CELL_STYLE),
         Paragraph("Gerar nova (padrão)", TABLE_CELL_STYLE),
         Paragraph("Guarde a senha! Necessária p/ updates", TABLE_CELL_STYLE)],
        [Paragraph("Display mode", TABLE_CELL_STYLE),
         Paragraph("standalone", TABLE_CELL_CENTER),
         Paragraph("Tela cheia sem barra do Chrome", TABLE_CELL_STYLE)],
    ]
    pkg_widths = [AVAILABLE_W * 0.22, AVAILABLE_W * 0.36, AVAILABLE_W * 0.42]
    pkg_table = Table(pkg_data, colWidths=pkg_widths, hAlign="CENTER",
                      repeatRows=1)
    pkg_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_FILL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(Spacer(1, 8))
    story.append(pkg_table)
    story.append(Paragraph("Tabela 3 — Campos do formulário Android do PWABuilder", CAPTION))

    numbered_step(
        4, "Baixe o ZIP com o APK",
        "Após ~1 minuto o PWABuilder entrega um arquivo "
        "<font name='DejaVuSans'>mirrortv-android-signed.zip</font>. Dentro "
        "dele há: <b>(a)</b> o <font name='DejaVuSans'>.apk</font> pronto "
        "para sideload, <b>(b)</b> o <font name='DejaVuSans'>.aab</font> "
        "(Android App Bundle) para Play Store, <b>(c)</b> o "
        "<font name='DejaVuSans'>.keystore</font> com que o APK foi "
        "assinado — <b>guarde esse keystore</b>, sem ele não dá para "
        "publicar updates.",
        story,
        code=(
            "mirrortv-android-signed.zip\n"
            "├── MirrorTV.apk              ← instalar no celular\n"
            "├── MirrorTV.aab              ← publicar na Play Store\n"
            "├── signing.keystore          ← GUARDAR (senha do passo 3)\n"
            "└── README.txt                ← instruções de assinatura"
        ),
        lang="text",
    )

    story.append(PageBreak())

    # ── Chapter 5: Passo 3 — Instalar no Android ─────────────────────
    h1("5. Passo 3 — Instalar o APK no Android", story)
    p(
        "Com o <font name='DejaVuSans'>.apk</font> assinado em mãos, o último "
        "passo é o <b>sideload</b>: instalar manualmente sem passar pela "
        "Play Store. Esse fluxo é ideal para teste interno, distribuição "
        "para poucos usuários ou prova de conceito.",
        story,
    )

    numbered_step(
        1, "Transfira o APK para o celular",
        "Use o método mais prático: Google Drive, Dropbox, Telegram (envie "
        "para si mesmo), ou cabo USB. O importante é que o arquivo "
        "<font name='DejaVuSans'>MirrorTV.apk</font> esteja acessível pelo "
        "gerenciador de arquivos do Android.",
        story,
    )

    numbered_step(
        2, "Habilite 'Fontes desconhecidas'",
        "No Android 9+, a permissão é por-app: vá em "
        "<b>Configurações → Aplicativos → Acesso especial → Instalar apps "
        "desconhecidos</b> e ative o gerenciador de arquivos que você vai "
        "usar (Files, Solid Explorer, etc.). No Android 8 e anteriores a "
        "opção fica em <b>Configurações → Segurança → Fontes "
        "desconhecidas</b>.",
        story,
    )

    numbered_step(
        3, "Toque no APK e instale",
        "Abra o APK pelo gerenciador de arquivos. O Android mostra um "
        "resumo de permissões (internet, captura de tela, áudio) e um "
        "botão <b>Instalar</b>. Toque e aguarde 10–20 segundos. Ao final, "
        "escolha <b>Abrir</b> ou <b>Concluir</b> — o ícone do MirrorTV "
        "estará na tela inicial, junto dos outros apps.",
        story,
    )

    numbered_step(
        4, "Valide o espelhamento",
        "Abra o MirrorTV pelo ícone (não mais pelo Chrome). Vá até a aba "
        "<b>Chromecast</b>, toque em <b>Selecionar TV</b>, escolha a Smart "
        "TV da mesma rede Wi-Fi e autorize a captura de tela. O espelho "
        "deve começar em 5–10 segundos. Se funcionar, está pronto.",
        story,
    )

    callout(
        "Aviso sobre Google Play Protect",
        "O Play Protect pode exibir um alerta ('aplicativo não "
        "reconhecido') ao instalar APKs fora da Play Store. Isso é "
        "esperado e <b>não bloqueia a instalação</b> — basta tocar em "
        "'Instalar mesmo assim'. Como o APK é seu, assinado por você, o "
        "risco é zero. Para distribuição pública, use a Play Store (ver "
        "próxima seção).",
        story, kind="warning",
    )

    story.append(PageBreak())

    # ── Chapter 6: Próximos Passos ───────────────────────────────────
    h1("6. Próximos Passos", story)
    p(
        "Com o APK funcionando, três caminhos naturais de evolução. Escolha "
        "conforme seu objetivo — distribuição ampla, identidade visual "
        "refinada, ou automação de release.",
        story,
    )

    next_data = [
        [Paragraph("<b>Trilha</b>", TABLE_HEADER_STYLE),
         Paragraph("<b>O que envolve</b>", TABLE_HEADER_STYLE),
         Paragraph("<b>Quando fazer</b>", TABLE_HEADER_STYLE)],
        [Paragraph("Publicar na Play Store", TABLE_CELL_STYLE),
         Paragraph(
             "1. Criar conta de desenvolvedor Google ($25, taxa única)<br/>"
             "2. No PWABuilder, baixar o <b>.aab</b> (não o APK)<br/>"
             "3. Criar listing no Play Console: nome, descrição, "
             "screenshots, ícone 512×512, banner 1024×500<br/>"
             "4. Fazer upload do AAB em 'Produção' e enviar para revisão",
             TABLE_CELL_STYLE),
         Paragraph("Quando o app estiver pronto para uso público", TABLE_CELL_STYLE)],
        [Paragraph("Customizar ícone e splash", TABLE_CELL_STYLE),
         Paragraph(
             "1. Substituir <font name='DejaVuSans'>public/icon-512.png</font> "
             "e <font name='DejaVuSans'>icon-maskable-512.png</font> pela "
             "marca própria<br/>"
             "2. No <font name='DejaVuSans'>manifest.json</font>, ajustar "
             "<font name='DejaVuSans'>theme_color</font> e "
             "<font name='DejaVuSans'>background_color</font><br/>"
             "3. Redeploy na Vercel e reempacotar no PWABuilder",
             TABLE_CELL_STYLE),
         Paragraph("Antes de publicar — define a identidade visual", TABLE_CELL_STYLE)],
        [Paragraph("Automatizar releases (CI/CD)", TABLE_CELL_STYLE),
         Paragraph(
             "1. Instalar Bubblewrap CLI: <font name='DejaVuSans'>npm i -g "
             "@bubblewrap/cli</font><br/>"
             "2. Inicializar: <font name='DejaVuSans'>bubblewrap init "
             "--manifest https://mirrortv.vercel.app/manifest.json</font><br/>"
             "3. Build: <font name='DejaVuSans'>bubblewrap build</font> "
             "→ gera APK/AAB local<br/>"
             "4. Integrar em GitHub Action: rodar a cada tag",
             TABLE_CELL_STYLE),
         Paragraph("Quando você tiver 3+ releases manuais e quiser automatizar", TABLE_CELL_STYLE)],
    ]
    next_widths = [AVAILABLE_W * 0.22, AVAILABLE_W * 0.55, AVAILABLE_W * 0.23]
    next_table = Table(next_data, colWidths=next_widths, hAlign="CENTER",
                       repeatRows=1)
    next_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_FILL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(Spacer(1, 8))
    story.append(next_table)
    story.append(Paragraph("Tabela 4 — Trilhas de evolução pós-APK", CAPTION))

    h2("Atualizar versões depois", story)
    p(
        "Sempre que você alterar o código e fizer um novo deploy na Vercel, "
        "a PWA publicada é atualizada automaticamente — não é preciso "
        "reempacotar o APK. O Android checa o service worker ao abrir o app "
        "e baixa a versão nova em background. Para mudanças no próprio APK "
        "(nome, ícone, versão interna), refaça o passo 4 do PWABuilder com "
        "a nova versão (1.0.1, 1.1.0…) e reinstale. O Android entende como "
        "update se o <b>Package ID</b> for o mesmo e a <b>versão</b> for "
        "maior — caso contrário, instala como app novo lado a lado.",
        story,
    )

    return story


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Build PDF
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def main():
    body_path = "/home/z/my-project/scripts/body.pdf"
    doc = SimpleDocTemplate(
        body_path,
        pagesize=A4,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN,
        title="MirrorTV — Quickstart PWA para APK",
        author="Z.ai",
        creator="Z.ai",
        subject="Guia passo a passo para transformar a PWA MirrorTV em APK Android",
    )
    story = build_story()
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"Body PDF gerado: {body_path}")


if __name__ == "__main__":
    main()
