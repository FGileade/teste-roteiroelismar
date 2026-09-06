import { ProductLoan, ProductLoanItem } from '../types';

type StoredProductLoan = Partial<ProductLoan> & {
  productName?: string;
  quantity?: string;
  returnDate?: string;
  returnNotes?: string;
  items?: Partial<ProductLoanItem>[];
};

export const getLoanStatus = (items: ProductLoanItem[]): ProductLoan['status'] => {
  return items.length > 0 && items.every(item => item.status === 'resolved') ? 'resolved' : 'pending';
};

export const normalizeProductLoan = (raw: unknown): ProductLoan | null => {
  if (!raw || typeof raw !== 'object') return null;

  const source = raw as StoredProductLoan;
  if (!source.id || !source.originClientId || !source.destClientId || !source.date || !source.createdAt) {
    return null;
  }

  const sourceItems = Array.isArray(source.items) ? source.items : [];
  const items: ProductLoanItem[] = sourceItems
    .map((item, index) => ({
      id: String(item.id || `${source.id}_item_${index + 1}`),
      productName: String(item.productName || '').trim(),
      quantity: String(item.quantity || '').trim(),
      status: item.status === 'resolved' ? ('resolved' as const) : ('pending' as const),
      returnDate: item.returnDate,
      returnNotes: item.returnNotes,
    }))
    .filter(item => item.productName && item.quantity);

  // Migração transparente dos registros antigos, que possuíam apenas um produto.
  if (items.length === 0 && source.productName && source.quantity) {
    items.push({
      id: `${source.id}_item_legacy`,
      productName: source.productName.trim(),
      quantity: source.quantity.trim(),
      status: source.status === 'resolved' ? 'resolved' : 'pending',
      returnDate: source.returnDate,
      returnNotes: source.returnNotes,
    });
  }

  if (items.length === 0) return null;

  return {
    id: String(source.id),
    originClientId: String(source.originClientId),
    originClientName: String(source.originClientName || ''),
    destClientId: String(source.destClientId),
    destClientName: String(source.destClientName || ''),
    items,
    date: String(source.date),
    status: getLoanStatus(items),
    notes: source.notes ? String(source.notes) : undefined,
    createdAt: String(source.createdAt),
  };
};

export const normalizeProductLoans = (raw: unknown): ProductLoan[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeProductLoan).filter((loan): loan is ProductLoan => loan !== null);
};

export const getLoanSearchText = (loan: ProductLoan): string => {
  return [
    loan.originClientName,
    loan.destClientName,
    loan.notes || '',
    ...loan.items.flatMap(item => [item.productName, item.quantity, item.returnNotes || '']),
  ].join(' ').toLowerCase();
};
