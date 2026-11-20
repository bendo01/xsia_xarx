Element.prototype.scrollIntoView = () => {};
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as any;
import { describe, expect, it } from 'vitest';
import { flush } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { Dialog } from '@kobalte/core/dialog';
import { DropdownMenu } from '@kobalte/core/dropdown-menu';
import { Popover } from '@kobalte/core/popover';
import { Tabs } from '@kobalte/core/tabs';

const press = (el: Element) => {
  const o = { bubbles: true, cancelable: true, pointerType: 'mouse', button: 0, isPrimary: true };
  el.dispatchEvent(new PointerEvent('pointerdown', o));
  el.dispatchEvent(new MouseEvent('mousedown', o));
  el.dispatchEvent(new PointerEvent('pointerup', o));
  el.dispatchEvent(new MouseEvent('mouseup', o));
  el.dispatchEvent(new MouseEvent('click', { ...o, detail: 1 }));
};
const tick = async () => { flush(); await new Promise((r) => setTimeout(r, 30)); flush(); };

describe('Kobalte 2.0 alpha primitives render and open on Solid 2', () => {
  it('Dialog opens and closes', async () => {
    const { getByText } = render(() => (
      <Dialog>
        <Dialog.Trigger>open-dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>dialog-title</Dialog.Title>
            <Dialog.CloseButton>close-dialog</Dialog.CloseButton>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    ));
    expect(screen.queryByText('dialog-title')).toBeNull();
    press(getByText('open-dialog'));
    await tick();
    expect(screen.queryByText('dialog-title')).not.toBeNull();
    press(screen.getByText('close-dialog'));
    await tick();
    expect(screen.queryByText('dialog-title')).toBeNull();
  });

  it('Popover opens', async () => {
    const { getByText } = render(() => (
      <Popover>
        <Popover.Trigger>open-pop</Popover.Trigger>
        <Popover.Portal><Popover.Content>pop-body</Popover.Content></Popover.Portal>
      </Popover>
    ));
    press(getByText('open-pop'));
    await tick();
    expect(screen.queryByText('pop-body')).not.toBeNull();
  });

  it('Tabs switch', async () => {
    const { getByText, queryByText } = render(() => (
      <Tabs defaultValue="a">
        <Tabs.List><Tabs.Trigger value="a">tab-a</Tabs.Trigger><Tabs.Trigger value="b">tab-b</Tabs.Trigger></Tabs.List>
        <Tabs.Content value="a">body-a</Tabs.Content>
        <Tabs.Content value="b">body-b</Tabs.Content>
      </Tabs>
    ));
    expect(queryByText('body-a')).not.toBeNull();
    getByText('tab-b').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    getByText('tab-b').click();
    await tick();
    expect(queryByText('body-b')).not.toBeNull();
  });

  it('DropdownMenu renders trigger', async () => {
    const { getByText } = render(() => (
      <DropdownMenu>
        <DropdownMenu.Trigger>open-menu</DropdownMenu.Trigger>
        <DropdownMenu.Portal><DropdownMenu.Content><DropdownMenu.Item>item-1</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal>
      </DropdownMenu>
    ));
    press(getByText('open-menu'));
    await tick();
    expect(screen.queryByText('item-1')).not.toBeNull();
  });
});
