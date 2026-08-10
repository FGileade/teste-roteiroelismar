from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from pathlib import Path

root = Path(r'C:\Users\filip\.gemini\antigravity\scratch\1. PROJETOS\roteiroelismar')
out = root / 'outputs' / 'resumo-melhorias-roteiro-elismar-resumido.pdf'
out.parent.mkdir(parents=True, exist_ok=True)

doc = SimpleDocTemplate(str(out), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=17*mm, bottomMargin=17*mm)
styles = getSampleStyleSheet()
navy = colors.HexColor('#211B55')
blue = colors.HexColor('#4338CA')
light = colors.HexColor('#F4F6FF')
muted = colors.HexColor('#64748B')
styles.add(ParagraphStyle(name='TitleCustom', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=25, leading=30, textColor=navy, alignment=TA_CENTER, spaceAfter=7))
styles.add(ParagraphStyle(name='Subtitle', parent=styles['Normal'], fontSize=11, leading=16, textColor=muted, alignment=TA_CENTER, spaceAfter=18))
styles.add(ParagraphStyle(name='H1Custom', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=16, leading=20, textColor=navy, spaceBefore=8, spaceAfter=8))
styles.add(ParagraphStyle(name='H2Custom', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=blue, spaceBefore=6, spaceAfter=4))
styles.add(ParagraphStyle(name='BodyCustom', parent=styles['BodyText'], fontSize=9.5, leading=14, textColor=colors.HexColor('#334155'), spaceAfter=6))
styles.add(ParagraphStyle(name='Small', parent=styles['BodyText'], fontSize=8, leading=11, textColor=muted))
styles.add(ParagraphStyle(name='Callout', parent=styles['BodyText'], fontSize=10, leading=15, textColor=navy, backColor=light, borderColor=colors.HexColor('#C7D2FE'), borderWidth=0.7, borderPadding=10, spaceBefore=4, spaceAfter=10))

def p(text, style='BodyCustom'):
    return Paragraph(text, styles[style])

def bullet(text):
    return Paragraph(f'• {text}', styles['BodyCustom'])

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#E2E8F0'))
    canvas.line(18*mm, 12*mm, A4[0]-18*mm, 12*mm)
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(muted)
    canvas.drawString(18*mm, 7*mm, 'Roteiro Elismar - Resumo executivo de melhorias')
    canvas.drawRightString(A4[0]-18*mm, 7*mm, f'Página {doc.page}')
    canvas.restoreState()

story = []
story += [Spacer(1, 10*mm), p('Roteiro Elismar', 'TitleCustom'), p('Resumo executivo de melhorias', 'Subtitle')]
story += [p('Uma plataforma comercial mobile-first, preparada para apoiar o vendedor em campo e dar ao gestor uma visão mais organizada da operação.', 'Callout')]
story += [p('Visão geral', 'H1Custom'), p('O aplicativo foi evoluído para centralizar clientes, visitas, rotas e registros comerciais em uma experiência simples, rápida e adequada ao uso pelo celular. A solução mantém foco em produtividade, operação offline e sincronização com a nuvem.', 'BodyCustom')]

data = [
    [p('<b>Área</b>', 'Small'), p('<b>Melhoria entregue</b>', 'Small'), p('<b>Benefício</b>', 'Small')],
    ['Clientes', 'Importação e exportação por Excel.', 'Atualização mais rápida da carteira.'],
    ['Rotas', 'Agenda organizada por frequência e dia.', 'Melhor planejamento das visitas.'],
    ['Offline', 'Uso sem internet e sincronização posterior.', 'Continuidade do trabalho em campo.'],
    ['Histórico', 'Atualização sem apagar registros anteriores.', 'Preservação do relacionamento comercial.'],
    ['Publicação', 'Aplicativo disponível online como PWA.', 'Acesso fácil pelo celular.'],
]
data = [data[0]] + [[p(str(value), 'Small') for value in row] for row in data[1:]]
table = Table(data, colWidths=[35*mm, 76*mm, 55*mm], repeatRows=1)
table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), navy), ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'), ('FONTSIZE', (0,0), (-1,-1), 8.5),
    ('LEADING', (0,0), (-1,-1), 12), ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ('GRID', (0,0), (-1,-1), 0.35, colors.HexColor('#CBD5E1')), ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light]),
    ('LEFTPADDING', (0,0), (-1,-1), 6), ('RIGHTPADDING', (0,0), (-1,-1), 6), ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6),
]))
story += [table, Spacer(1, 9*mm)]

story += [p('Importação de clientes', 'H1Custom'), p('A nova função permite atualizar a carteira de clientes por planilha, com conversão automática dos dados de rota e relatório do resultado.', 'BodyCustom')]
for item in [
    'Atualização rápida da carteira de clientes.',
    'Conversão automática dos dados de rota.',
    'Relatório de clientes criados, atualizados e ignorados.',
    'Download da base atualizada em Excel.',
]: story.append(bullet(item))

story += [PageBreak(), p('Segurança dos dados', 'H1Custom'), p('As atualizações preservam o histórico comercial existente, incluindo visitas, negociações e empréstimos.', 'BodyCustom')]

story += [p('Status de publicação', 'H1Custom'), p('A versão atual foi compilada e publicada no Firebase Hosting. O aplicativo está disponível em:', 'BodyCustom'), p('<b>https://roteiroelismar.web.app</b>', 'Callout')]
story += [p('Próximos passos recomendados', 'H1Custom')]
for item in ['Validar a sincronização dos clientes.', 'Testar o uso no celular com o vendedor.', 'Orientar o gestor sobre backup e exportação.']: story.append(bullet(item))
story += [Spacer(1, 8*mm), p('Documento preparado para apresentação ao cliente e gestor do aplicativo.', 'Small')]

doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(out)
