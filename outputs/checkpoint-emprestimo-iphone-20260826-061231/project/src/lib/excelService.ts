import * as XLSX from 'xlsx';
import { Client, RouteFrequency, WeekDay } from '../types';

export interface ExcelImportReport {
  clients: Client[];
  created: number;
  updated: number;
  ignored: number;
  warnings: string[];
}

const normalize = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const text = (value: unknown) => String(value ?? '').trim();

const weekdayMap: Record<string, WeekDay> = {
  segunda: 'monday', 'segunda-feira': 'monday', terca: 'tuesday', 'terca-feira': 'tuesday',
  quarta: 'wednesday', 'quarta-feira': 'wednesday', quinta: 'thursday', 'quinta-feira': 'thursday',
  sexta: 'friday', 'sexta-feira': 'friday', sabado: 'saturday', 'sabado-feira': 'saturday',
};

const frequencyMap: Record<string, RouteFrequency> = {
  semanal: 'weekly', quinzenal: 'biweekly', mensal: 'monthly', avulso: 'adhoc', 'avulso (sem rota recorrente)': 'adhoc', adhoc: 'adhoc',
};

const findColumn = (headers: string[], aliases: string[]) => {
  const index = headers.findIndex(header => aliases.some(alias => normalize(header).includes(normalize(alias))));
  return index >= 0 ? index : undefined;
};

const cell = (row: unknown[], index?: number) => index === undefined ? '' : row[index];

export async function importClientsFromExcel(file: File, existingClients: Client[] = []): Promise<ExcelImportReport> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames.find(name => normalize(name) === 'cariacica_viana') || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const headerRowIndex = matrix.findIndex(row => row.some(value => normalize(value).includes('nome fantasia')));
  if (headerRowIndex < 0) throw new Error('Não foi encontrada a linha de cabeçalhos da aba CARIACICA_VIANA.');

  const headers = matrix[headerRowIndex].map(value => text(value));
  const columns = {
    code: findColumn(headers, ['código externo', 'codigo externo', 'codigo', 'id']),
    name: findColumn(headers, ['nome fantasia', 'nome da loja', 'nome']),
    legalName: findColumn(headers, ['razão social', 'razao social']),
    displayName: findColumn(headers, ['nome a ser exibido', 'nome exibido']),
    buyer: findColumn(headers, ['comprador', 'contato']),
    phone: findColumn(headers, ['whatsapp', 'telefone', 'phone']),
    cep: findColumn(headers, ['cep']),
    street: findColumn(headers, ['rua', 'logradouro', 'endereço', 'endereco']),
    number: findColumn(headers, ['número', 'numero']),
    neighborhood: findColumn(headers, ['bairro']),
    city: findColumn(headers, ['cidade']),
    state: findColumn(headers, ['estado', 'uf']),
    frequency: findColumn(headers, ['frequência', 'frequencia']),
    weekday: findColumn(headers, ['dia da semana']),
    rotation: findColumn(headers, ['rota recorrente', 'semana a', 'semana b']),
    monthWeek: findColumn(headers, ['semana preferencial', 'semana do mês', 'semana do mes']),
  };

  const warnings: string[] = [];
  const imported: Client[] = [];
  let ignored = 0;
  const seenCodes = new Set<string>();

  for (let rowIndex = headerRowIndex + 1; rowIndex < matrix.length; rowIndex++) {
    const row = matrix[rowIndex];
    const name = text(cell(row, columns.name));
    const code = text(cell(row, columns.code));
    if (!name && !code) { ignored++; continue; }
    if (normalize(name) === 'tirar da base' || normalize(cell(row, columns.frequency)) === 'tirar da base' || normalize(cell(row, columns.weekday)) === 'tirar da base') {
      ignored++; continue;
    }
    if (!name) { warnings.push(`Linha ${rowIndex + 1}: ignorada por não possuir Nome Fantasia.`); ignored++; continue; }
    if (code && seenCodes.has(code)) warnings.push(`Linha ${rowIndex + 1}: código externo duplicado ${code}; foi mantido o primeiro registro.`);
    if (code && seenCodes.has(code)) { ignored++; continue; }
    if (code) seenCodes.add(code);

    const frequencyValue = normalize(cell(row, columns.frequency));
    const weekdayValue = normalize(cell(row, columns.weekday));
    const frequency = frequencyMap[frequencyValue] || 'adhoc';
    const weekday = weekdayMap[weekdayValue];
    const rotation = normalize(cell(row, columns.rotation));
    const monthWeekValue = normalize(cell(row, columns.monthWeek));
    const existing = existingClients.find(client => code && client.externalCode === code) || existingClients.find(client => normalize(client.name) === normalize(name) && normalize(client.phone) === normalize(cell(row, columns.phone)));
    const addressParts = [text(cell(row, columns.street)), text(cell(row, columns.number)), text(cell(row, columns.neighborhood))].filter(Boolean).join(', ');
    const cityState = [text(cell(row, columns.city)), text(cell(row, columns.state))].filter(Boolean).join(' - ');
    const address = [addressParts, cityState, text(cell(row, columns.cep))].filter(Boolean).join(' | ');
    imported.push({
      ...(existing || {}),
      id: existing?.id || `c_excel_${Date.now()}_${rowIndex}`,
      createdAt: existing?.createdAt || new Date().toISOString(),
      name,
      legalName: text(cell(row, columns.legalName)) || existing?.legalName,
      displayNameType: normalize(cell(row, columns.displayName)) ? 'name' : existing?.displayNameType || 'name',
      buyerName: text(cell(row, columns.buyer)) || existing?.buyerName || '',
      phone: text(cell(row, columns.phone)) || existing?.phone || '',
      address: address || existing?.address || '',
      city: text(cell(row, columns.city)) || existing?.city,
      externalCode: code || existing?.externalCode,
      frequency,
      weekday,
      weekOffset: frequency === 'biweekly' ? (rotation.includes('b') ? 1 : 0) : undefined,
      monthWeek: frequency === 'monthly' ? (monthWeekValue.includes('segunda') ? 2 : monthWeekValue.includes('terceira') ? 3 : monthWeekValue.includes('quarta') ? 4 : monthWeekValue.includes('quinta') ? 5 : 1) : undefined,
      routeOrder: existing?.routeOrder ?? rowIndex,
    });
  }

  const importedById = new Map(imported.map(client => [client.id, client]));
  const merged = existingClients.map(client => importedById.get(client.id) || client);
  imported.forEach(client => { if (!merged.some(current => current.id === client.id)) merged.push(client); });
  return { clients: merged, created: imported.filter(client => !existingClients.some(existing => existing.id === client.id)).length, updated: imported.filter(client => existingClients.some(existing => existing.id === client.id)).length, ignored, warnings };
}

export function exportClientsToExcel(clients: Client[]) {
  const weekdays: Record<string, string> = { monday: 'Segunda-feira', tuesday: 'Terça-feira', wednesday: 'Quarta-feira', thursday: 'Quinta-feira', friday: 'Sexta-feira', saturday: 'Sábado' };
  const frequencies: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quinzenal', monthly: 'Mensal', adhoc: 'Avulso (sem rota recorrente)' };
  const rows = clients.map(client => ({ 'Código Externo': client.externalCode || '', 'Nome Fantasia': client.name, 'Razão Social': client.legalName || '', 'Nome do Comprador / Contato': client.buyerName, 'WhatsApp / Telefone': client.phone, 'Endereço': client.address, Cidade: client.city || '', Latitude: client.latitude ?? '', Longitude: client.longitude ?? '', 'Frequência da Visita Recorrente': frequencies[client.frequency], 'Dia da Semana Preferencial': client.weekday ? weekdays[client.weekday] : '', 'Rota Recorrente Semanal': client.frequency === 'biweekly' ? (client.weekOffset === 1 ? 'Semana B' : 'Semana A') : 'Não se aplica', 'Semana Preferencial': client.frequency === 'monthly' ? `${client.monthWeek || 1}ª Semana do mês` : 'Não se aplica', 'Ordem da Rota': client.routeOrder }));
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, 'CARIACICA_VIANA');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Frequências aceitas', 'Semanal, Quinzenal, Mensal, Avulso'], ['Quinzena', 'Semana A ou Semana B'], ['Mensal', 'Primeira a Quinta Semana do mês']]), 'Configuração de Rota de Visitas');
  XLSX.writeFile(workbook, `clientes_roteiroelismar_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
