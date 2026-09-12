import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { AppSelectComponent } from './select.component';

@Component({
  imports: [ReactiveFormsModule, AppSelectComponent],
  template: `<app-select
    label="Account"
    labelPlacement="outside"
    [formControl]="control"
    [options]="options"
  />`,
})
class SelectHost {
  control = new FormControl('owner', { nonNullable: true });
  options = [
    { value: '', label: 'No login linked' },
    { value: 'owner', label: 'Owner' },
    { value: 'unavailable', label: 'Unavailable', disabled: true },
  ];
}

describe('AppSelectComponent', () => {
  it('supports form values, selection, touched state, and disabled state', async () => {
    await TestBed.configureTestingModule({ imports: [SelectHost] }).compileComponents();
    const fixture = TestBed.createComponent(SelectHost);
    fixture.detectChanges();
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatSelectHarness);
    expect(await select.getValueText()).toBe('Owner');
    await select.open();
    const options = await select.getOptions();
    expect(await options[2].isDisabled()).toBeTrue();
    await options[0].click();
    expect(fixture.componentInstance.control.value).toBe('');
    expect(fixture.componentInstance.control.touched).toBeTrue();
    expect(await select.getValueText()).toBe('No login linked');
    fixture.componentInstance.control.setValue('owner');
    fixture.detectChanges();
    expect(await select.getValueText()).toBe('Owner');
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(await select.isDisabled()).toBeTrue();
  });
});
