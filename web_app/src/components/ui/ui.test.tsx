import { afterEach, describe, expect, it } from 'vitest';
import { flush } from 'solid-js';
import { cleanup, render, screen } from '@solidjs/testing-library';

import { Badge } from './badge';
import { Button } from './button';
import { Card, CardTitle } from './card';
import { Checkbox } from './checkbox';
import { CommandPalette } from './command';
import { DrawerClose, DrawerContent, DrawerRoot, DrawerTitle, DrawerTrigger } from './drawer';
import { Input } from './input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

Element.prototype.scrollIntoView = () => {};

const tick = async () => {
  flush();
  await new Promise((r) => setTimeout(r, 30));
  flush();
};
const press = (el: Element) => {
  const o = { bubbles: true, cancelable: true, pointerType: 'mouse', button: 0, isPrimary: true };
  el.dispatchEvent(new PointerEvent('pointerdown', o));
  el.dispatchEvent(new MouseEvent('mousedown', o));
  el.dispatchEvent(new PointerEvent('pointerup', o));
  el.dispatchEvent(new MouseEvent('mouseup', o));
  el.dispatchEvent(new MouseEvent('click', { ...o, detail: 1 }));
};

afterEach(cleanup);

describe('ui kit', () => {
  it('Button merges variant classes and lets class override, defaults type=button', () => {
    render(() => <Button variant="destructive" class="px-10">go</Button>);
    const b = screen.getByText('go');
    expect(b.getAttribute('type')).toBe('button');
    expect(b.className).toContain('bg-destructive');
    expect(b.className).toContain('px-10');
    expect(b.className).not.toContain('px-4'); // twMerge: caller wins
  });

  it('Button passes through native attributes and handlers', () => {
    let clicks = 0;
    render(() => <Button disabled={false} aria-label="x" onClick={() => clicks++}>c</Button>);
    const b = screen.getByLabelText('x');
    b.click();
    expect(clicks).toBe(1);
  });

  it('Input / Badge / Card forward props', () => {
    render(() => (
      <div>
        <Input placeholder="p" class="w-20" />
        <Badge variant="success">ok</Badge>
        <Card><CardTitle>t</CardTitle></Card>
      </div>
    ));
    expect(screen.getByPlaceholderText('p').className).toContain('w-20');
    expect(screen.getByText('ok').className).toContain('bg-success/15');
    expect(screen.getByText('t').className).toContain('font-semibold');
  });

  it('Table renders semantic cells', () => {
    render(() => (
      <Table>
        <TableHeader><TableRow><TableHead>h</TableHead></TableRow></TableHeader>
        <TableBody><TableRow><TableCell>c</TableCell></TableRow></TableBody>
      </Table>
    ));
    expect(screen.getByText('h').tagName).toBe('TH');
    expect(screen.getByText('c').tagName).toBe('TD');
  });

  it('Checkbox shows its label only when given one', () => {
    render(() => <Checkbox label="agree" />);
    expect(screen.queryByText('agree')).not.toBeNull();
  });

  it('Drawer (Kobalte-based) opens and closes', async () => {
    render(() => (
      <DrawerRoot>
        <DrawerTrigger>open</DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>sheet</DrawerTitle>
          <DrawerClose>shut</DrawerClose>
        </DrawerContent>
      </DrawerRoot>
    ));
    expect(screen.queryByText('sheet')).toBeNull();
    press(screen.getByText('open'));
    await tick();
    expect(screen.queryByText('sheet')).not.toBeNull();
    press(screen.getByText('shut'));
    await tick();
    expect(screen.queryByText('sheet')).toBeNull();
  });

  it('CommandPalette filters and runs the highlighted item', async () => {
    const ran: string[] = [];
    render(() => (
      <CommandPalette
        open
        onOpenChange={() => {}}
        items={[
          { id: 'a', label: 'Alpha', onSelect: () => ran.push('a') },
          { id: 'b', label: 'Beta', group: 'G', onSelect: () => ran.push('b') },
        ]}
      />
    ));
    await tick();
    const input = screen.getByPlaceholderText('Search…') as HTMLInputElement;
    input.value = 'bet';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await tick();
    expect(screen.queryByText('Alpha')).toBeNull();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await tick();
    expect(ran).toEqual(['b']);
  });
});
