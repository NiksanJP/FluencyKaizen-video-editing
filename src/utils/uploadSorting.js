export const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Date Added (Newest)' },
  { value: 'date_asc', label: 'Date Added (Oldest)' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
];

const parseDate = (value) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const getComparableDate = (upload) => {
  if (!upload) return null;
  const candidates = [upload.addedAt, upload.createdAt, upload.modifiedAt, upload.completedAt];
  for (const candidate of candidates) {
    const parsed = parseDate(candidate);
    if (parsed !== null) return parsed;
  }
  return null;
};

export const compareUploads = (a, b, sortOption = 'date_desc') => {
  switch (sortOption) {
    case 'name_asc': {
      const aName = (a?.name || '').toLowerCase();
      const bName = (b?.name || '').toLowerCase();
      if (aName === bName) return 0;
      if (!aName) return 1;
      if (!bName) return -1;
      return aName.localeCompare(bName);
    }
    case 'name_desc': {
      const aName = (a?.name || '').toLowerCase();
      const bName = (b?.name || '').toLowerCase();
      if (aName === bName) return 0;
      if (!aName) return 1;
      if (!bName) return -1;
      return bName.localeCompare(aName);
    }
    case 'date_asc': {
      const aDate = getComparableDate(a);
      const bDate = getComparableDate(b);
      if (aDate === bDate) return 0;
      if (aDate === null) return 1;
      if (bDate === null) return -1;
      return aDate - bDate;
    }
    case 'date_desc':
    default: {
      const aDate = getComparableDate(a);
      const bDate = getComparableDate(b);
      if (aDate === bDate) return 0;
      if (aDate === null) return 1;
      if (bDate === null) return -1;
      return bDate - aDate;
    }
  }
};

export const sortUploads = (uploads = [], sortOption = 'date_desc') => {
  return [...uploads].sort((a, b) => compareUploads(a, b, sortOption));
};
