export interface ListOption<T> {
  label: string;
  value: T;
  sub?: string;
}

export function openListModal<T>(
  title: string,
  options: ListOption<T>[],
  current: T,
  onSelect: (value: T) => void,
): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const sheet = document.createElement('div');
  sheet.className = 'modal-sheet';

  const header = document.createElement('div');
  header.className = 'modal-title';
  header.textContent = title;
  sheet.appendChild(header);

  const list = document.createElement('div');
  list.className = 'modal-list';
  options.forEach((opt) => {
    const row = document.createElement('div');
    row.className = 'modal-row';
    if (opt.value === current) row.classList.add('active');
    const label = document.createElement('div');
    label.className = 'modal-row-label';
    label.textContent = opt.label;
    row.appendChild(label);
    if (opt.sub) {
      const sub = document.createElement('div');
      sub.className = 'modal-row-sub';
      sub.textContent = opt.sub;
      row.appendChild(sub);
    }
    row.addEventListener('click', () => {
      onSelect(opt.value);
      close();
    });
    list.appendChild(row);
  });
  sheet.appendChild(list);

  const close = () => {
    overlay.classList.add('closing');
    setTimeout(() => overlay.remove(), 160);
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  overlay.appendChild(sheet);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add('shown');
    const active = list.querySelector('.modal-row.active') as HTMLElement | null;
    if (active) {
      list.scrollTop = active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2;
    }
  });
}
